import { NextRequest, NextResponse } from 'next/server';
import {
  getAllOrders,
  getOrdersWithin,
  createOrderWithStockDeduction,
  InsufficientStockError,
  ProductMissingError,
} from '@/lib/orders';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/audit';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const role = (session.user as any)?.role || '';
    const { searchParams } = new URL(req.url);

    if (role.includes('admin')) {
      // Admin clients pass ?paginated=1&days=2&page=1&pageSize=10 to use the
      // bounded view (registry on the admin terminal). Without those params we
      // return the legacy unbounded list so other admin tooling keeps working.
      if (searchParams.get('paginated') === '1') {
        const days = Math.max(1, Math.min(30, Number(searchParams.get('days')) || 2));
        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const pageSize = Math.max(1, Math.min(50, Number(searchParams.get('pageSize')) || 10));
        const result = await getOrdersWithin(days * DAY_MS, page, pageSize);
        return NextResponse.json(result);
      }
      const orders = await getAllOrders();
      return NextResponse.json(orders);
    } else {
      const { getOrdersByUser } = await import('@/lib/orders');
      const orders = await getOrdersByUser(session.user?.email || '');
      return NextResponse.json(orders);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const paymentMethod: 'cod' | 'gcash' = body.paymentMethod === 'gcash' ? 'gcash' : 'cod';

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const itemsRequested = body.items.map((it: any) => ({
      productId: String(it.productId),
      quantity: Math.max(1, Number(it.quantity) || 0),
    }));

    const order = await createOrderWithStockDeduction({
      itemsRequested,
      customerName: session.user?.name || 'Unknown',
      customerEmail: session.user?.email || '',
      deliveryMethod: body.deliveryMethod === 'standard' ? 'standard' : 'pickup',
      pickupPointId: body.pickupPointId || undefined,
      pickupPointName: body.pickupPointName || undefined,
      paymentMethod,
    });

    await logAction({
      action: 'ORDER_CREATED',
      actor: session.user?.email || 'unknown',
      target: order.id!,
      details: `Order placed for PHP ${order.total.toFixed(2)} with ${order.items.length} item(s) (${paymentMethod})`,
      createdAt: new Date(),
    });

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ProductMissingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('orders POST error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
