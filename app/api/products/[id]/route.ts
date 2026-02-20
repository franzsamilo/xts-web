import { NextResponse } from 'next/server';
import { deleteProductFromDb, updateProduct } from '@/lib/products';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.role?.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteProductFromDb(id);

    await logAction({
      action: 'PRODUCT_DELETED',
      actor: session.user?.email || 'unknown',
      target: id,
      details: `Product removed from inventory`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.role?.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateProduct(id, body);

    await logAction({
      action: 'PRODUCT_UPDATED',
      actor: session.user?.email || 'unknown',
      target: id,
      details: `Product updated: ${body.name || id}`,
      createdAt: new Date(),
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
