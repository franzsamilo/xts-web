import { NextResponse } from 'next/server';
import { getAllPosts, createPost } from '@/lib/posts';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const posts = await getAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const authorName = session.user?.name?.split(' ')[0] || 'Anonymous';
    const userId = (session.user as any)?.id || session.user?.email || 'unknown';

    const post = await createPost({
      title: body.title,
      content: body.content,
      author: authorName,
      avatar: authorName[0].toUpperCase(),
      tag: body.tag || 'Build Log',
      likes: 0,
      likedBy: [],
      comments: 0,
      isPinned: false,
      imageUrls: body.imageUrls || [],
      userId,
      userEmail: session.user?.email || '',
      createdAt: new Date(),
    });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
