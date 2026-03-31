import { NextRequest, NextResponse } from 'next/server';
import { getMessages, addMessage, getChatById, deleteChat, markChatAsRead } from '@/lib/chat';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is a participant
    const chat = await getChatById(id);
    if (!chat || !chat.participants.includes(session.user.email)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const messages = await getMessages(id);

    markChatAsRead(id, session.user.email).catch(() => {});

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

    // Verify user is a participant
    const chat = await getChatById(id);
    if (!chat || !chat.participants.includes(session.user.email)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();

    const message = await addMessage(id, {
      senderId: session.user.email,
      senderName: session.user.name || 'User',
      senderAvatar: session.user.image || '',
      content: body.content,
      createdAt: new Date(),
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const role = (session.user as any)?.role || '';

    // Only participants or admins can delete
    const chat = await getChatById(id);
    if (!chat) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (!chat.participants.includes(session.user.email) && !role.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteChat(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
