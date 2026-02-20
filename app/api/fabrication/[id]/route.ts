import { NextResponse } from 'next/server';
import { updateJobStatus } from '@/lib/fabrication';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any)?.role || '';
  if (!role.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { status, progress } = await req.json();
    await updateJobStatus(id, status, progress);

    await logAction({
      action: 'FAB_JOB_UPDATED',
      actor: session.user?.email || 'unknown',
      target: id,
      details: `Job status: ${status}, progress: ${progress}%`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
