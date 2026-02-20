import { adminDb } from '@/lib/firebase/admin';

export async function createApplication(data: any) {
  try {
    const docRef = await adminDb.collection('applications').add({
      ...data,
      status: 'pending',
      createdAt: new Date(),
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
}

export async function getAllApplications() {
  try {
    const snapshot = await adminDb.collection('applications').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
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
