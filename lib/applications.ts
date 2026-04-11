import { adminDb } from '@/lib/firebase/admin';

export type ApplicationType = 'expert' | 'seller';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ApplicationData {
  id?: string;
  type: ApplicationType;
  name: string;
  expertise: string;
  description?: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: ApplicationStatus;
  createdAt: Date | any;
  updatedAt?: Date | any;
}

export async function createApplication(
  data: Omit<ApplicationData, 'id' | 'status' | 'createdAt'>
): Promise<ApplicationData> {
  const docRef = await adminDb.collection('applications').add({
    ...data,
    status: 'pending',
    createdAt: new Date(),
  });
  return { id: docRef.id, ...data, status: 'pending', createdAt: new Date() };
}

export async function getAllApplications(): Promise<ApplicationData[]> {
  try {
    const snapshot = await adminDb.collection('applications').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<ApplicationData, 'id'>),
    }));
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}

export async function updateApplicationStatus(id: string, status: 'approved' | 'rejected') {
  try {
    await adminDb.collection('applications').doc(id).update({
      status: status,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
}
