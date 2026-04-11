import { NextResponse } from 'next/server';
import { updateJobStatus } from '@/lib/fabrication';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { isAdmin } from '@/lib/roles';

const VALID_FAB_STATUSES = ['queued', 'reviewing', 'in-progress', 'completed', 'cancelled'] as const;
type FabStatus = typeof VALID_FAB_STATUSES[number];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const status = body?.status as FabStatus;
    if (!VALID_FAB_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${VALID_FAB_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const progressNum = Number(body?.progress);
    if (!Number.isFinite(progressNum)) {
      return NextResponse.json({ error: 'progress must be a number' }, { status: 400 });
    }
    const progress = Math.max(0, Math.min(100, Math.round(progressNum)));

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
    console.error('fabrication PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
