import { NextRequest, NextResponse } from 'next/server';
import { getChatsByUser, createChat } from '@/lib/chat';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const chats = await getChatsByUser(session.user.email);
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const chat = await createChat({
      participants: [session.user.email, body.recipientId],
      participantNames: {
        [session.user.email]: session.user.name || 'User',
        [body.recipientId]: body.recipientName || 'Seller',
      },
      productRef: body.productRef || undefined,
      type: body.type || 'product',
      lastMessage: body.initialMessage || '',
      createdAt: new Date(),
    });
    
    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
