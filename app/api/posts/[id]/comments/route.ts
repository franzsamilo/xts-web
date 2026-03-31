import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET comments for a post
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const snapshot = await adminDb
      .collection('posts')
      .doc(id)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .get();

    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    }));

    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST a new comment on a post
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { content } = await req.json();
    const authorName = session.user?.name?.split(' ')[0] || 'Anonymous';

    const commentRef = await adminDb
      .collection('posts')
      .doc(id)
      .collection('comments')
      .add({
        content,
        author: authorName,
        avatar: authorName[0].toUpperCase(),
        createdAt: new Date(),
      });

    // Atomically increment the post's comment count
    const { FieldValue } = await import('firebase-admin/firestore');
    const postRef = adminDb.collection('posts').doc(id);
    await postRef.update({ comments: FieldValue.increment(1) });

    return NextResponse.json({
      id: commentRef.id,
      content,
      author: authorName,
      avatar: authorName[0].toUpperCase(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
