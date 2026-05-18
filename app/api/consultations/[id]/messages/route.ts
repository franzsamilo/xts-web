import { NextRequest, NextResponse } from 'next/server';
import { getConsultationMessages, addConsultationMessage, getConsultationById, markConsultationAsRead } from '@/lib/consultations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const consultation = await getConsultationById(id);
    if (!consultation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const role = (session.user as any)?.role || '';
    const isParticipant =
      consultation.clientEmail === session.user.email ||
      role.includes('admin') ||
      role.includes('expert');

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await getConsultationMessages(id);
    try {
      await markConsultationAsRead(id, session.user.email);
    } catch {}
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const consultation = await getConsultationById(id);
    if (!consultation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const role = (session.user as any)?.role || '';
    const isParticipant =
      consultation.clientEmail === session.user.email ||
      role.includes('admin') ||
      role.includes('expert');

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    const message = await addConsultationMessage(id, {
      senderId: session.user.email,
      senderName: session.user.name || 'User',
      content: content.slice(0, 2000),
      createdAt: new Date(),
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
