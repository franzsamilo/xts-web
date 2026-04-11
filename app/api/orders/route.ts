import { NextResponse } from 'next/server';
import {
  getAllOrders,
  createOrderWithStockDeduction,
  InsufficientStockError,
  ProductMissingError,
} from '@/lib/orders';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const role = (session.user as any)?.role || '';
    if (role.includes('admin')) {
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
