import { NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/orders';
import { getProductById } from '@/lib/products';
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
    const paymentMethod = body.paymentMethod || 'cod';

    // Validate each item's price and stock from the database
    const validatedItems = [];
    let serverTotal = 0;

    for (const item of body.items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product "${item.name}" no longer exists` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}" (available: ${product.stock})` },
          { status: 400 }
        );
      }

      validatedItems.push({
        productId: item.productId,
        name: product.name,
        sku: product.sku || '',
        category: product.category || 'Hardware',
        price: product.price,
        quantity: item.quantity,
      });
      serverTotal += product.price * item.quantity;
    }

    const order = await createOrder({
      items: validatedItems,
      total: serverTotal,
      status: 'pending',
      customerName: session.user?.name || 'Unknown',
      customerEmail: session.user?.email || '',
      deliveryMethod: body.deliveryMethod || 'pickup',
      pickupPointId: body.pickupPointId || undefined,
      pickupPointName: body.pickupPointName || undefined,
      paymentMethod,
      createdAt: new Date(),
    });

    await logAction({
      action: 'ORDER_CREATED',
      actor: session.user?.email || 'unknown',
      target: order.id!,
      details: `Order placed for PHP ${serverTotal.toFixed(2)} with ${validatedItems.length} item(s) (${paymentMethod})`,
      createdAt: new Date(),
    });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
