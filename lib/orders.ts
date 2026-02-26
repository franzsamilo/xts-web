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

export interface OrderData {
  id?: string;
  items: OrderItem[];
  total: number;
  status: string; // pending, confirmed, processing, shipped, delivered, completed
  statusHistory?: StatusHistoryEntry[];
  customerName: string;
  customerEmail: string;
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
  const docRef = await adminDb.collection('orders').add({
    ...data,
    status: 'pending',
    statusHistory: [{
      status: 'pending',
      timestamp: new Date().toISOString(),
      updatedBy: 'system',
    }],
    createdAt: new Date(),
  });
  return { id: docRef.id, ...data };
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
