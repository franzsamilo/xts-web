import { NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/lib/products';
import { getServerSession } from 'next-auth';

export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const product = await createProduct(body);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
