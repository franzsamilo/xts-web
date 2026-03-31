import { NextResponse } from 'next/server';
import { getAllConsultations, getConsultationsByUser, createConsultation } from '@/lib/consultations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const role = (session.user as any)?.role || '';
    if (role.includes('admin') || role.includes('expert')) {
      const consultations = await getAllConsultations();
      return NextResponse.json(consultations);
    } else {
      const consultations = await getConsultationsByUser(session.user?.email || '');
      return NextResponse.json(consultations);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const consultation = await createConsultation({
      expertName: body.expertName,
      expertTitle: body.expertTitle,
      expertPrice: body.expertPrice,
      clientName: session.user?.name || 'Unknown',
      clientEmail: session.user?.email || '',
      slot: body.slot,
      status: 'pending',
      createdAt: new Date(),
    });
    return NextResponse.json(consultation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create consultation' }, { status: 500 });
  }
}
