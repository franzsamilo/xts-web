import { adminDb } from '@/lib/firebase/admin';

export interface ConsultationData {
  id?: string;
  expertName: string;
  expertTitle: string;
  expertPrice: string;
  clientName: string;
  clientEmail: string;
  slot: string;
  status: string;
  createdAt: Date | any;
}

export async function getAllConsultations(): Promise<ConsultationData[]> {
  try {
    const snapshot = await adminDb
      .collection('consultations')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as ConsultationData[];
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return [];
  }
}

export async function getConsultationsByUser(email: string): Promise<ConsultationData[]> {
  try {
    const snapshot = await adminDb
      .collection('consultations')
      .where('clientEmail', '==', email)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as ConsultationData[];
  } catch (error) {
    console.error('Error fetching user consultations:', error);
    return [];
  }
}

export async function createConsultation(data: Omit<ConsultationData, 'id'>): Promise<ConsultationData> {
  const docRef = await adminDb.collection('consultations').add({
    ...data,
    createdAt: new Date(),
  });
  return { id: docRef.id, ...data };
}

export async function updateConsultationStatus(id: string, status: string): Promise<void> {
  await adminDb.collection('consultations').doc(id).update({ status });
}
