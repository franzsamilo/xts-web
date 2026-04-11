import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

export class InsufficientStockError extends Error {
  productName: string;
  available: number;
  requested: number;
  constructor(productName: string, available: number, requested: number) {
    super(`Insufficient stock for "${productName}" (available: ${available}, requested: ${requested})`);
    this.name = 'InsufficientStockError';
    this.productName = productName;
    this.available = available;
    this.requested = requested;
  }
}

export class ProductMissingError extends Error {
  productId: string;
  constructor(productId: string) {
    super(`Product ${productId} no longer exists`);
    this.name = 'ProductMissingError';
    this.productId = productId;
  }
}

/**
 * Atomically validates stock, decrements product stock, and creates the order
 * inside a single Firestore transaction. Prevents oversell when concurrent
 * orders race for the same product.
 */
export async function createOrderWithStockDeduction(input: {
  itemsRequested: { productId: string; quantity: number }[];
  customerName: string;
  customerEmail: string;
  deliveryMethod: 'standard' | 'pickup';
  pickupPointId?: string;
  pickupPointName?: string;
  paymentMethod: 'cod' | 'gcash';
}): Promise<OrderData> {
  const paymentStatus: OrderPaymentStatus =
    input.paymentMethod === 'gcash' ? 'awaiting_gateway' : 'pending';

  return await adminDb.runTransaction(async (tx) => {
    const productRefs = input.itemsRequested.map((it) =>
      adminDb.collection('products').doc(it.productId)
    );
    const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

    const validatedItems: OrderItem[] = [];
    let serverTotal = 0;

    productSnaps.forEach((snap, idx) => {
      const requested = input.itemsRequested[idx];
      if (!snap.exists) {
        throw new ProductMissingError(requested.productId);
      }
      const product = snap.data() as {
        name: string;
        sku?: string;
        category?: string;
        price: number;
        stock: number;
      };
      if ((product.stock ?? 0) < requested.quantity) {
        throw new InsufficientStockError(product.name, product.stock ?? 0, requested.quantity);
      }
      validatedItems.push({
        productId: requested.productId,
        name: product.name,
        sku: product.sku || '',
        category: product.category || 'Hardware',
        price: product.price,
        quantity: requested.quantity,
      });
      serverTotal += product.price * requested.quantity;
    });

    productRefs.forEach((ref, idx) => {
      tx.update(ref, { stock: FieldValue.increment(-input.itemsRequested[idx].quantity) });
    });

    const orderRef = adminDb.collection('orders').doc();
    const orderDoc: Omit<OrderData, 'id'> = {
      items: validatedItems,
      total: serverTotal,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date().toISOString(),
        updatedBy: 'system',
      }],
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      deliveryMethod: input.deliveryMethod,
      pickupPointId: input.pickupPointId,
      pickupPointName: input.pickupPointName,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      createdAt: new Date(),
    };
    tx.set(orderRef, orderDoc);

    return { id: orderRef.id, ...orderDoc };
  });
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

/** Idempotent: safe for concurrent webhook retries (Firestore transaction). */
export async function markOrderPaidFromPaymongo(
  orderId: string,
  paymongoPaymentId?: string
): Promise<boolean> {
  const ref = adminDb.collection('orders').doc(orderId);
  return await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;

    const existing = snap.data() as OrderData | undefined;
    if (existing?.paymentStatus === 'paid') return true;

    const history = existing?.statusHistory || [];
    history.push({
      status: 'processing',
      timestamp: new Date().toISOString(),
      updatedBy: 'paymongo',
    });

    tx.update(ref, {
      paymentStatus: 'paid',
      paymongoPaymentId: paymongoPaymentId ?? null,
      paidAt: new Date().toISOString(),
      status: 'processing',
      statusHistory: history,
    });
    return true;
  });
}

/**
 * Idempotent. Marks order failed and restores stock for its items.
 * Stock is only restored once — guarded by stockRestoredAt to avoid double-restore
 * if the failure webhook is delivered multiple times.
 */
export async function markOrderPaymentFailed(orderId: string, reason?: string): Promise<void> {
  const ref = adminDb.collection('orders').doc(orderId);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;

    const existing = snap.data() as (OrderData & { stockRestoredAt?: string }) | undefined;
    if (!existing) return;
    if (existing.paymentStatus === 'paid') return;
    if (existing.paymentStatus === 'failed' && existing.stockRestoredAt) return;

    const productRefs = (existing.items || []).map((it) =>
      adminDb.collection('products').doc(it.productId)
    );
    const productSnaps = await Promise.all(productRefs.map((r) => tx.get(r)));

    productSnaps.forEach((psnap, idx) => {
      if (!psnap.exists) return;
      tx.update(productRefs[idx], {
        stock: FieldValue.increment(existing.items[idx].quantity),
      });
    });

    tx.update(ref, {
      paymentStatus: 'failed',
      stockRestoredAt: new Date().toISOString(),
      ...(reason ? { paymentFailureReason: reason } : {}),
    });
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
