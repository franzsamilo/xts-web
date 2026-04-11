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

/** Look up a user record by email. Used for chat recipient validation. */
export async function getUserByEmail(email: string): Promise<{ id: string; name?: string; email?: string } | null> {
  try {
    const snap = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...(doc.data() as any) };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
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
