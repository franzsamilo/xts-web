import { NextResponse } from 'next/server';
import { likePost } from '@/lib/posts';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = (session.user as any)?.id || session.user?.email || 'unknown';
    const result = await likePost(id, userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
