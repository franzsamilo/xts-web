import { NextResponse } from 'next/server';
import { getAllJobs, createJob } from '@/lib/fabrication';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const role = (session.user as any)?.role || '';
    if (role.includes('admin')) {
      const jobs = await getAllJobs();
      return NextResponse.json(jobs);
    } else {
      const { getJobsByUser } = await import('@/lib/fabrication');
      const jobs = await getJobsByUser(session.user?.email || '');
      return NextResponse.json(jobs);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fabrication jobs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const job = await createJob({
      name: body.name,
      files: body.files,
      status: 'queued',
      progress: 0,
      customerName: session.user?.name || 'Unknown',
      customerEmail: session.user?.email || '',
      notes: body.notes || '',
      serviceType: body.serviceType || undefined,
      parameters: body.parameters || undefined,
      preferredSchedule: body.preferredSchedule || undefined,
      createdAt: new Date(),
    });

    await logAction({
      action: 'FAB_JOB_CREATED',
      actor: session.user?.email || 'unknown',
      target: job.id,
      details: `Fabrication request for ${body.files.length} file(s): ${body.name}`,
      createdAt: new Date(),
    });

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fabrication job' }, { status: 500 });
  }
}
