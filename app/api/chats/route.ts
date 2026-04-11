import { NextRequest, NextResponse } from 'next/server';
import { getChatsByUser, createChat, findExistingChat, addMessage, getUnreadChatCount, ChatData } from '@/lib/chat';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ADMIN_INBOX_EMAIL } from '@/lib/admin-email';
import { isAdmin, isSeller } from '@/lib/roles';
import { getUserByEmail } from '@/lib/users';

const VALID_CHAT_TYPES: ChatData['type'][] = ['product', 'consultation', 'support', 'pickup'];
const MAX_MESSAGE_LEN = 2000;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    if (searchParams.get('unreadCount') === 'true') {
      const count = await getUnreadChatCount(session.user.email);
      return NextResponse.json({ count });
    }

    let chats = await getChatsByUser(session.user.email);

    // Staff (admin/seller) also see chats addressed to the shared inbox.
    const role = (session.user as any)?.role || '';
    if (isAdmin(role) || isSeller(role)) {
      const adminChats = await getChatsByUser(ADMIN_INBOX_EMAIL);
      const existingIds = new Set(chats.map((c: any) => c.id));
      for (const ac of adminChats) {
        if (!existingIds.has(ac.id)) chats.push(ac);
      }
    }

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const recipientId = typeof body?.recipientId === 'string' ? body.recipientId.trim() : '';
    if (!recipientId) {
      return NextResponse.json({ error: 'Missing recipientId' }, { status: 400 });
    }
    if (recipientId === session.user.email) {
      return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });
    }

    // The recipient must either be the shared admin inbox or a real user.
    // Pull the display name from the users collection — never trust the body
    // (which would let an attacker spoof "Bob's Hardware Co" or similar).
    let recipientName: string;
    if (recipientId === ADMIN_INBOX_EMAIL) {
      recipientName = 'XTS Admin';
    } else {
      const recipient = await getUserByEmail(recipientId);
      if (!recipient) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
      }
      recipientName = recipient.name || recipientId;
    }

    const type: ChatData['type'] = VALID_CHAT_TYPES.includes(body?.type)
      ? body.type
      : 'product';
    const initialMessage =
      typeof body?.initialMessage === 'string'
        ? body.initialMessage.trim().slice(0, MAX_MESSAGE_LEN)
        : '';

    const existingChat = await findExistingChat(
      session.user.email,
      recipientId,
      body?.productRef?.id
    );

    if (existingChat) {
      if (initialMessage && existingChat.id) {
        await addMessage(existingChat.id, {
          senderId: session.user.email,
          senderName: session.user.name || 'User',
          content: initialMessage,
          createdAt: new Date(),
        });
      }
      return NextResponse.json(existingChat);
    }

    const chat = await createChat({
      participants: [session.user.email, recipientId],
      participantNames: {
        [session.user.email]: session.user.name || 'User',
        [recipientId]: recipientName,
      },
      productRef: body?.productRef || undefined,
      pickupRef: body?.pickupRef || undefined,
      type,
      lastMessage: initialMessage,
      createdAt: new Date(),
    });

    if (initialMessage && chat.id) {
      await addMessage(chat.id, {
        senderId: session.user.email,
        senderName: session.user.name || 'User',
        content: initialMessage,
        createdAt: new Date(),
      });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
