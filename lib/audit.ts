import { adminDb } from '@/lib/firebase/admin';

export interface AuditEntry {
  id?: string;
  action: string;        // e.g. ORDER_CREATED, PRODUCT_ADDED, ROLE_CHANGED
  actor: string;         // email or name
  target?: string;       // target entity id/name
  details?: string;      // additional info
  createdAt: Date | any;
}

export async function logAction(data: Omit<AuditEntry, 'id'>): Promise<void> {
  try {
    await adminDb.collection('audit_logs').add({
      ...data,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}

export async function getAuditLogs(limit: number = 50): Promise<AuditEntry[]> {
  try {
    const snapshot = await adminDb
      .collection('audit_logs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as AuditEntry[];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}
