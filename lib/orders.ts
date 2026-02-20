import { adminDb } from '@/lib/firebase/admin';

export interface OrderItem {
  productId: string;
  name: string;
  sku?: string;
  category?: string;
  price: number;
  quantity: number;
}

export interface OrderData {
  id?: string;
  items: OrderItem[];
  total: number;
  status: string; // processing, shipped, delivered
  customerName: string;
  customerEmail: string;
  createdAt: Date | any;
}

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
    createdAt: new Date(),
  });
  return { id: docRef.id, ...data };
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await adminDb.collection('orders').doc(id).update({ status });
}
