import { NextResponse } from 'next/server';
import { deleteProductFromDb, updateProduct, getProductById, ProductData } from '@/lib/products';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { isAdmin } from '@/lib/roles';
import { buildProductPayload } from '../route';

const ALLOWED_PATCH_FIELDS: (keyof ProductData)[] = [
  'name', 'sku', 'price', 'stock', 'category', 'description', 'tag', 'imageUrls', 'specifications',
];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !isAdmin((session.user as any)?.role)) {
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

  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Build a sanitized full payload, then keep only the fields the client
    // actually sent — so PATCH stays partial but never lets unknown keys
    // (rating, totalSold, sellerId, etc.) flow through.
    const sanitized = buildProductPayload({ ...body, name: body?.name ?? 'placeholder', price: body?.price ?? 0, stock: body?.stock ?? 0 });
    if ('error' in sanitized) {
      return NextResponse.json({ error: sanitized.error }, { status: 400 });
    }

    const update: Partial<ProductData> = {};
    for (const field of ALLOWED_PATCH_FIELDS) {
      if (field in body) {
        (update as any)[field] = (sanitized as any)[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await updateProduct(id, update);

    await logAction({
      action: 'PRODUCT_UPDATED',
      actor: session.user?.email || 'unknown',
      target: id,
      details: `Product updated: ${update.name || id}`,
      createdAt: new Date(),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('products PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
