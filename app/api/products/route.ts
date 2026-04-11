import { NextResponse } from 'next/server';
import { getAllProducts, createProduct, ProductData, SpecificationField } from '@/lib/products';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';

const MAX_NAME = 200;
const MAX_SKU = 64;
const MAX_CATEGORY = 80;
const MAX_DESCRIPTION = 5000;
const MAX_TAG = 60;
const MAX_IMAGE_URLS = 12;
const MAX_SPEC_FIELDS = 40;

function sanitizeSpecs(input: unknown): SpecificationField[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, MAX_SPEC_FIELDS)
    .map((row): SpecificationField | null => {
      if (!row || typeof row !== 'object') return null;
      const r = row as { key?: unknown; value?: unknown };
      if (typeof r.key !== 'string' || typeof r.value !== 'string') return null;
      return { key: r.key.trim().slice(0, 80), value: r.value.trim().slice(0, 400) };
    })
    .filter((v): v is SpecificationField => !!v && !!v.key);
}

function sanitizeImageUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((u): u is string => typeof u === 'string')
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, MAX_IMAGE_URLS);
}

export function buildProductPayload(body: any): Omit<ProductData, 'id'> | { error: string } {
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
  if (!name) return { error: 'name is required' };

  const sku = typeof body?.sku === 'string' ? body.sku.trim().slice(0, MAX_SKU) : '';

  const priceNum = Number(body?.price);
  if (!Number.isFinite(priceNum) || priceNum < 0) return { error: 'price must be a non-negative number' };

  const stockNum = Number(body?.stock);
  if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
    return { error: 'stock must be a non-negative integer' };
  }

  const category = typeof body?.category === 'string' ? body.category.trim().slice(0, MAX_CATEGORY) : 'Hardware';
  const description = typeof body?.description === 'string' ? body.description.slice(0, MAX_DESCRIPTION) : '';
  const tag = typeof body?.tag === 'string' ? body.tag.trim().slice(0, MAX_TAG) : '';

  return {
    name,
    sku,
    price: priceNum,
    stock: stockNum,
    category,
    description,
    tag,
    imageUrls: sanitizeImageUrls(body?.imageUrls),
    specifications: sanitizeSpecs(body?.specifications),
    rating: null,
    totalSold: 0,
  };
}

export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json(products, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const payload = buildProductPayload(body);
    if ('error' in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 });
    }
    const product = await createProduct(payload);
    return NextResponse.json(product);
  } catch (error) {
    console.error('products POST error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
