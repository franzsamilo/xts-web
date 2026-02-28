import { adminDb } from '@/lib/firebase/admin';

export interface PickupPoint {
  id?: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: Date | any;
}

const COLLECTION = 'pickupPoints';

// Default pickup points — always available as fallback
export const DEFAULT_PICKUP_POINTS: PickupPoint[] = [
  {
    id: 'default-cpu-gad',
    name: 'Central Philippine University — CPU GAD Office',
    address: 'CPU GAD Office, Jaro, Iloilo City',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export async function getAllPickupPoints(activeOnly = false): Promise<PickupPoint[]> {
  try {
    // Simple query — no composite index needed
    const snapshot = await adminDb.collection(COLLECTION).get();
    let points = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as PickupPoint[];

    if (activeOnly) {
      points = points.filter(p => p.isActive !== false);
    }

    // Sort by createdAt descending (in code, no composite index needed)
    points.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // If no points exist in Firestore, return defaults
    if (points.length === 0) {
      return DEFAULT_PICKUP_POINTS;
    }

    return points;
  } catch (error) {
    console.error('Error fetching pickup points:', error);
    // Return defaults on any error
    return DEFAULT_PICKUP_POINTS;
  }
}

export async function createPickupPoint(data: Omit<PickupPoint, 'id'>): Promise<PickupPoint> {
  const docRef = await adminDb.collection(COLLECTION).add({
    name: data.name,
    address: data.address,
    isActive: true,
    createdAt: new Date(),
  });
  return { id: docRef.id, name: data.name, address: data.address, isActive: true, createdAt: new Date().toISOString() };
}

export async function updatePickupPoint(id: string, data: Partial<PickupPoint>): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update(data);
}

export async function deletePickupPoint(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}
