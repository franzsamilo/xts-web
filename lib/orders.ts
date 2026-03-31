import { adminDb } from '@/lib/firebase/admin';

export interface OrderItem {
  productId: string;
  name: string;
  sku?: string;
  category?: string;
  price: number;
  quantity: number;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  updatedBy: string;
}

export type OrderPaymentStatus = 'pending' | 'awaiting_gateway' | 'paid' | 'failed';

export interface OrderData {
  id?: string;
  items: OrderItem[];
  total: number;
  status: string; // pending, confirmed, processing, shipped, delivered, completed
  statusHistory?: StatusHistoryEntry[];
  customerName: string;
  customerEmail: string;
  deliveryMethod: 'standard' | 'pickup';
  pickupPointId?: string;
  pickupPointName?: string;
  paymentMethod?: 'cod' | 'gcash';
  /** COD: pending. GCash before PayMongo: awaiting_gateway. After webhook success: paid. */
  paymentStatus?: OrderPaymentStatus;
  paymongoLinkId?: string;
  paymongoPaymentId?: string;
  paidAt?: string;
  paymentFailureReason?: string | null;
  createdAt: Date | any;
}

export const ORDER_PHASES = [
  { key: 'pending', label: 'Pending', color: 'bg-zinc-500' },
  { key: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
  { key: 'processing', label: 'Processing', color: 'bg-yellow-500' },
  { key: 'shipped', label: 'Shipped', color: 'bg-purple-500' },
  { key: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-700' },
];

export async function getAllOrders(): Promise<OrderData[]> {
  try {
    const snapshot = await adminDb
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as OrderData[];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getOrdersByUser(email: string): Promise<OrderData[]> {
  try {
    const snapshot = await adminDb
      .collection('orders')
      .where('customerEmail', '==', email)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as OrderData[];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

export async function createOrder(data: Omit<OrderData, 'id'>): Promise<OrderData> {
  const paymentStatus: OrderPaymentStatus =
    data.paymentMethod === 'gcash' ? 'awaiting_gateway' : 'pending';

  const docRef = await adminDb.collection('orders').add({
    ...data,
    paymentStatus,
    status: 'pending',
    statusHistory: [{
      status: 'pending',
      timestamp: new Date().toISOString(),
      updatedBy: 'system',
    }],
    createdAt: new Date(),
  });

  return {
    id: docRef.id,
    ...data,
    paymentStatus,
    status: 'pending',
  };
}

export async function getOrderById(id: string): Promise<OrderData | null> {
  const doc = await adminDb.collection('orders').doc(id).get();
  if (!doc.exists) return null;
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
  } as OrderData;
}

export async function updateOrderPaymongoLinkId(
  orderId: string,
  paymongoLinkId: string
): Promise<void> {
  await adminDb.collection('orders').doc(orderId).update({
    paymongoLinkId,
  });
}

/** Idempotent: safe for webhook retries. */
export async function markOrderPaidFromPaymongo(
  orderId: string,
  paymongoPaymentId?: string
): Promise<boolean> {
  const ref = adminDb.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return false;

  const existing = snap.data() as OrderData | undefined;
  if (existing?.paymentStatus === 'paid') return true;

  const history = existing?.statusHistory || [];
  history.push({
    status: 'processing',
    timestamp: new Date().toISOString(),
    updatedBy: 'paymongo',
  });

  await ref.update({
    paymentStatus: 'paid',
    paymongoPaymentId: paymongoPaymentId ?? null,
    paidAt: new Date().toISOString(),
    status: 'processing',
    statusHistory: history,
  });
  return true;
}

export async function markOrderPaymentFailed(orderId: string, reason?: string): Promise<void> {
  const ref = adminDb.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const existing = snap.data() as OrderData | undefined;
  if (existing?.paymentStatus === 'paid') return;

  await ref.update({
    paymentStatus: 'failed',
    ...(reason ? { paymentFailureReason: reason } : {}),
  });
}

export async function updateOrderStatus(id: string, status: string, updatedBy: string = 'admin'): Promise<void> {
  const doc = await adminDb.collection('orders').doc(id).get();
  const existing = doc.data();
  const history = existing?.statusHistory || [];
  
  history.push({
    status,
    timestamp: new Date().toISOString(),
    updatedBy,
  });

  await adminDb.collection('orders').doc(id).update({ 
    status,
    statusHistory: history,
  });
}
