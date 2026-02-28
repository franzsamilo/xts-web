import { adminDb } from '@/lib/firebase/admin';

export interface PickupPoint {
  id?: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: Date | any;
}

const COLLECTION = 'pickupPoints';

export async function getAllPickupPoints(activeOnly = false): Promise<PickupPoint[]> {
  try {
    let query: any = adminDb.collection(COLLECTION).orderBy('createdAt', 'desc');
    if (activeOnly) {
      query = query.where('isActive', '==', true);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as PickupPoint[];
  } catch (error) {
    console.error('Error fetching pickup points:', error);
    return [];
  }
}

export async function createPickupPoint(data: Omit<PickupPoint, 'id'>): Promise<PickupPoint> {
  const docRef = await adminDb.collection(COLLECTION).add({
    ...data,
    isActive: true,
    createdAt: new Date(),
  });
  return { id: docRef.id, ...data };
}

export async function updatePickupPoint(id: string, data: Partial<PickupPoint>): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update(data);
}

export async function deletePickupPoint(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}
