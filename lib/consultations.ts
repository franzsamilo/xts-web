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
  /** Identifier for the curated consultation type the customer picked. */
  consultationType?: string;
  /** Free-text problem statement from the request form. */
  projectDescription?: string;
  /** Tools/skills the customer thinks the engagement needs. */
  requiredSkills?: string;
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

export async function updateConsultationFields(
  id: string,
  fields: Partial<Pick<ConsultationData, 'expertName' | 'expertTitle' | 'expertPrice' | 'slot' | 'status'>> & { expertId?: string }
): Promise<void> {
  const update: Record<string, any> = {};
  if (fields.expertName !== undefined) update.expertName = fields.expertName;
  if (fields.expertTitle !== undefined) update.expertTitle = fields.expertTitle;
  if (fields.expertPrice !== undefined) update.expertPrice = fields.expertPrice;
  if (fields.slot !== undefined) update.slot = fields.slot;
  if (fields.status !== undefined) update.status = fields.status;
  if (fields.expertId !== undefined) update.expertId = fields.expertId;
  if (Object.keys(update).length === 0) return;
  await adminDb.collection('consultations').doc(id).update(update);
}

export async function getConsultationById(id: string): Promise<ConsultationData | null> {
  try {
    const doc = await adminDb.collection('consultations').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    } as ConsultationData;
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return null;
  }
}
