import { NextResponse } from 'next/server';
import { getAllJobs, getJobsByUser, createJob } from '@/lib/fabrication';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { isAdmin } from '@/lib/roles';

const MAX_NAME = 200;
const MAX_NOTES = 2000;
const MAX_FILES = 30;
const MAX_FILENAME = 200;
const VALID_SERVICE_TYPES = ['3d-printing', 'laser-cutting', 'pcb-fabrication'] as const;

function clampString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function sanitizeFileNames(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((f): f is string => typeof f === 'string')
    .map((f) => f.trim().slice(0, MAX_FILENAME))
    .filter(Boolean)
    .slice(0, MAX_FILES);
}

function sanitizeUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((u): u is string => typeof u === 'string')
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, MAX_FILES);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const role = (session.user as any)?.role || '';
    const jobs = isAdmin(role)
      ? await getAllJobs()
      : await getJobsByUser(session.user?.email || '');
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('fabrication GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch fabrication jobs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const name = clampString(body?.name, MAX_NAME);
    const files = sanitizeFileNames(body?.files);
    if (!name || files.length === 0) {
      return NextResponse.json(
        { error: 'name and at least one file are required' },
        { status: 400 }
      );
    }

    const serviceType = VALID_SERVICE_TYPES.includes(body?.serviceType)
      ? body.serviceType
      : undefined;

    const job = await createJob({
      name,
      files,
      fileUrls: sanitizeUrls(body?.fileUrls),
      status: 'queued',
      progress: 0,
      customerName: session.user.name || 'Unknown',
      customerEmail: session.user.email,
      notes: clampString(body?.notes, MAX_NOTES),
      serviceType,
      parameters:
        body?.parameters && typeof body.parameters === 'object' && !Array.isArray(body.parameters)
          ? body.parameters
          : undefined,
      preferredSchedule:
        body?.preferredSchedule &&
        typeof body.preferredSchedule === 'object' &&
        typeof body.preferredSchedule.startDate === 'string' &&
        typeof body.preferredSchedule.endDate === 'string'
          ? {
              startDate: body.preferredSchedule.startDate.slice(0, 64),
              endDate: body.preferredSchedule.endDate.slice(0, 64),
            }
          : undefined,
      createdAt: new Date(),
    });

    await logAction({
      action: 'FAB_JOB_CREATED',
      actor: session.user.email,
      target: job.id,
      details: `Fabrication request for ${files.length} file(s): ${name}`,
      createdAt: new Date(),
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('fabrication POST error:', error);
    return NextResponse.json({ error: 'Failed to create fabrication job' }, { status: 500 });
  }
}
