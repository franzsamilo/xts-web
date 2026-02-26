import { NextRequest, NextResponse } from 'next/server';
import { getMessages, addMessage, getChatById } from '@/lib/chat';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const messages = await getMessages(id);
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
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
