import { NextResponse } from 'next/server';
import { getAllApplications, createApplication } from '@/lib/applications';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.role?.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await getAllApplications();
  return NextResponse.json(applications);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const application = await createApplication({
      ...body,
      userId: (session.user as any)?.id || session.user?.email,
      userEmail: session.user?.email,
      userName: session.user?.name,
    });
    return NextResponse.json(application);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
