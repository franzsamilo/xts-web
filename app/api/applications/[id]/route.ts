import { NextResponse } from 'next/server';
import { updateApplicationStatus } from '@/lib/applications';
import { updateUserRole } from '@/lib/users';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.role?.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // 1. Update application status
    await updateApplicationStatus(id, status);

    // 2. If approved, update user role
    if (status === 'approved') {
      const appDoc = await adminDb.collection('applications').doc(id).get();
      if (appDoc.exists) {
        const appData = appDoc.data();
        if (appData?.userId) {
          const userDoc = await adminDb.collection('users').doc(appData.userId).get();
          const currentRole = userDoc.exists ? userDoc.data()?.role || 'member' : 'member';

          let newRole = currentRole;
          if (!newRole.includes('expert')) {
            newRole = newRole === 'member' ? 'expert' : `${newRole},expert`;
          }

          await updateUserRole(appData.userId, newRole);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
