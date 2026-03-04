import { adminDb } from '@/lib/firebase/admin';

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: Date | any;
}

export interface ChatData {
  id?: string;
  participants: string[];
  participantNames: Record<string, string>;
  productRef?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  pickupRef?: {
    pointId: string;
    pointName: string;
    pointAddress: string;
  };
  lastMessage?: string;
  lastMessageAt?: Date | any;
  lastReadBy?: Record<string, string>; // email -> ISO timestamp
  hasUnread?: boolean;
  type: 'product' | 'consultation' | 'support' | 'pickup';
  createdAt: Date | any;
}

export async function getChatsByUser(userId: string): Promise<ChatData[]> {
  try {
    const snapshot = await adminDb
      .collection('chats')
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessageAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const lastMessageAt = data.lastMessageAt?.toDate?.()?.toISOString?.() || new Date().toISOString();
      const lastReadBy = data.lastReadBy || {};
      const userLastRead = lastReadBy[userId];
      const hasUnread = !userLastRead || new Date(lastMessageAt) > new Date(userLastRead);

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        lastMessageAt,
        lastReadBy,
        hasUnread: data.lastMessage ? hasUnread : false,
      };
    }) as ChatData[];
  } catch (error) {
    console.error('Error fetching chats:', error);
    return [];
  }
}

export async function createChat(data: Omit<ChatData, 'id'>): Promise<ChatData> {
  const docRef = await adminDb.collection('chats').add({
    ...data,
    createdAt: new Date(),
    lastMessageAt: new Date(),
  });
  return { id: docRef.id, ...data };
}

export async function getChatById(id: string): Promise<ChatData | null> {
  try {
    const doc = await adminDb.collection('chats').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as ChatData;
  } catch (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
}

export async function getMessages(chatId: string): Promise<ChatMessage[]> {
  try {
    const snapshot = await adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as ChatMessage[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function addMessage(chatId: string, message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
  const docRef = await adminDb
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .add({
      ...message,
      createdAt: new Date(),
    });

  // Update last message on chat
  await adminDb.collection('chats').doc(chatId).update({
    lastMessage: message.content,
    lastMessageAt: new Date(),
  });

  return { id: docRef.id, ...message };
}

export async function findExistingChat(
  participantA: string,
  participantB: string,
  productId?: string
): Promise<ChatData | null> {
  try {
    let query = adminDb
      .collection('chats')
      .where('participants', 'array-contains', participantA);

    const snapshot = await query.get();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.participants.includes(participantB)) {
        if (productId && data.productRef?.id === productId) {
          return { id: doc.id, ...data } as ChatData;
        }
        if (!productId && !data.productRef) {
          return { id: doc.id, ...data } as ChatData;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding chat:', error);
    return null;
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  // Delete all messages in the subcollection first
  const messagesSnap = await adminDb.collection('chats').doc(chatId).collection('messages').get();
  const batch = adminDb.batch();
  messagesSnap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  // Delete the chat document
  await adminDb.collection('chats').doc(chatId).delete();
}

export async function markChatAsRead(chatId: string, userId: string): Promise<void> {
  const now = new Date().toISOString();
  await adminDb.collection('chats').doc(chatId).update({
    [`lastReadBy.${userId}`]: now,
  });
}

export async function getUnreadChatCount(userId: string): Promise<number> {
  try {
    const chats = await getChatsByUser(userId);
    return chats.filter(c => c.hasUnread).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}
