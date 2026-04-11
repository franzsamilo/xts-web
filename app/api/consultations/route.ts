import { NextResponse } from 'next/server';
import { getAllConsultations, getConsultationsByUser, createConsultation } from '@/lib/consultations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin, isExpert } from '@/lib/roles';

const MAX_TITLE = 120;
const MAX_PRICE_HINT = 60;
const MAX_SLOT = 120;
const MAX_NAME = 120;

function clampString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const role = (session.user as any)?.role || '';
    if (isAdmin(role) || isExpert(role)) {
      const consultations = await getAllConsultations();
      return NextResponse.json(consultations);
    } else {
      const consultations = await getConsultationsByUser(session.user?.email || '');
      return NextResponse.json(consultations);
    }
  } catch (error) {
    console.error('consultations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const expertTitle = clampString(body?.expertTitle, MAX_TITLE);
    if (!expertTitle) {
      return NextResponse.json({ error: 'expertTitle is required' }, { status: 400 });
    }

    const consultation = await createConsultation({
      // expertName is admin-managed once a real expert is assigned; the request
      // form only knows it's "Pending Assignment" until then.
      expertName: clampString(body?.expertName, MAX_NAME) || 'Pending Assignment',
      expertTitle,
      // expertPrice in this app is the client's BUDGET HINT (free-text), not a
      // billing amount. Cap to prevent abuse.
      expertPrice: clampString(body?.expertPrice, MAX_PRICE_HINT) || 'TBD',
      clientName: session.user.name || 'Unknown',
      clientEmail: session.user.email,
      slot: clampString(body?.slot, MAX_SLOT) || 'Flexible',
      status: 'pending',
      createdAt: new Date(),
    });
    return NextResponse.json(consultation);
  } catch (error) {
    console.error('consultations POST error:', error);
    return NextResponse.json({ error: 'Failed to create consultation' }, { status: 500 });
  }
}
