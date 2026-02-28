import { NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/orders';
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
    // Admin sees all orders, regular users see only their own
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
    const order = await createOrder({
      items: body.items,
      total: body.total,
      status: 'processing',
      customerName: session.user?.name || 'Unknown',
      customerEmail: session.user?.email || '',
      deliveryMethod: body.deliveryMethod || 'standard',
      pickupPointId: body.pickupPointId || undefined,
      pickupPointName: body.pickupPointName || undefined,
      createdAt: new Date(),
    });

    await logAction({
      action: 'ORDER_CREATED',
      actor: session.user?.email || 'unknown',
      target: order.id,
      details: `Order placed for PHP ${body.total.toFixed(2)} with ${body.items.length} item(s)`,
      createdAt: new Date(),
    });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
