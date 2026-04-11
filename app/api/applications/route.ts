import { NextResponse } from 'next/server';
import { getAllApplications, createApplication, ApplicationType } from '@/lib/applications';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';

const VALID_TYPES: ApplicationType[] = ['expert', 'seller'];
const MAX_NAME = 120;
const MAX_EXPERTISE = 500;
const MAX_DESCRIPTION = 2000;

function clampString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await getAllApplications();
  return NextResponse.json(applications);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const type = body?.type as ApplicationType;
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid application type' }, { status: 400 });
    }

    const name = clampString(body?.name, MAX_NAME);
    const expertise = clampString(body?.expertise, MAX_EXPERTISE);
    const description = clampString(body?.description, MAX_DESCRIPTION);

    if (!name || !expertise) {
      return NextResponse.json(
        { error: 'Name and expertise are required' },
        { status: 400 }
      );
    }

    // Whitelist explicitly — never spread the body, or clients can set
    // status: 'approved', reviewedBy, etc. and bypass the review workflow.
    const application = await createApplication({
      type,
      name,
      expertise,
      description: description || undefined,
      userId: ((session.user as any)?.id as string) || session.user.email,
      userEmail: session.user.email,
      userName: session.user.name || 'Unknown',
    });
    return NextResponse.json(application);
  } catch (error) {
    console.error('applications POST error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
