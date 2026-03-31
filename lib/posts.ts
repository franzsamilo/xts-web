import { adminDb } from '@/lib/firebase/admin';

export interface PostData {
  id?: string;
  title: string;
  content: string;
  author: string;
  avatar: string;
  tag: string;
  likes: number;
  likedBy: string[];
  comments: number;
  isPinned: boolean;
  imageUrls?: string[];
  userId?: string;
  userEmail?: string;
  createdAt: Date | any;
}

export async function getAllPosts(): Promise<PostData[]> {
  try {
    const snapshot = await adminDb
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as PostData[];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function createPost(data: Omit<PostData, 'id'>): Promise<PostData> {
  try {
    const docRef = await adminDb.collection('posts').add({
      ...data,
      createdAt: new Date(),
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

export async function likePost(postId: string, userId: string): Promise<{ likes: number; alreadyLiked: boolean }> {
  const { FieldValue } = await import('firebase-admin/firestore');
  const docRef = adminDb.collection('posts').doc(postId);
  const doc = await docRef.get();

  if (!doc.exists) throw new Error('Post not found');

  const data = doc.data()!;
  const likedBy: string[] = data.likedBy || [];

  if (likedBy.includes(userId)) {
    return { likes: data.likes, alreadyLiked: true };
  }

  await docRef.update({
    likes: FieldValue.increment(1),
    likedBy: FieldValue.arrayUnion(userId),
  });

  return { likes: (data.likes || 0) + 1, alreadyLiked: false };
}
