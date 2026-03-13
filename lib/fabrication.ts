import { adminDb } from '@/lib/firebase/admin';

export interface FabJobData {
  id?: string;
  name: string;         // Job title derived from file names
  files: string[];      // File names submitted
  fileUrls?: string[];  // Cloud storage URLs for download
  status: string;       // queued, reviewing, in-progress, completed
  progress: number;     // 0-100
  customerName: string;
  customerEmail: string;
  notes?: string;
  serviceType?: string; // '3d-printing' | 'laser-cutting' | 'pcb-fabrication'
  parameters?: Record<string, string>;
  preferredSchedule?: { startDate: string; endDate: string };
  createdAt: Date | any;
}

export async function getAllJobs(): Promise<FabJobData[]> {
  try {
    const snapshot = await adminDb
      .collection('fabrication_jobs')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as FabJobData[];
  } catch (error) {
    console.error('Error fetching fab jobs:', error);
    return [];
  }
}

export async function getJobsByUser(email: string): Promise<FabJobData[]> {
  try {
    const snapshot = await adminDb
      .collection('fabrication_jobs')
      .where('customerEmail', '==', email)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as FabJobData[];
  } catch (error) {
    console.error('Error fetching user fab jobs:', error);
    return [];
  }
}

export async function createJob(data: Omit<FabJobData, 'id'>): Promise<FabJobData> {
  const docRef = await adminDb.collection('fabrication_jobs').add({
    ...data,
    createdAt: new Date(),
  });
  return { id: docRef.id, ...data };
}

export async function updateJobStatus(id: string, status: string, progress: number): Promise<void> {
  await adminDb.collection('fabrication_jobs').doc(id).update({ status, progress });
}
