import { adminDb } from '@/lib/firebase/admin';

export async function getAllUsers() {
  try {
    const usersSnapshot = await adminDb.collection('users').get();
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}
export async function updateUserRole(userId: string, role: string) {
  try {
    await adminDb.collection('users').doc(userId).update({
      role: role
    });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}
