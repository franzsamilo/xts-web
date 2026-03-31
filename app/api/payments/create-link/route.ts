import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createPaymongoPaymentLink,
  PayMongoApiError,
  readJsonBody,
} from '@/lib/paymongo';
import { BASE_CURRENCY, PAYMONGO_MIN_AMOUNT_PHP } from '@/lib/currency';
import { getOrderById, updateOrderPaymongoLinkId } from '@/lib/orders';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderId } = await readJsonBody<{ orderId: string }>(req);
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customerEmail !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.paymentMethod !== 'gcash') {
      return NextResponse.json({ error: 'Order is not a GCash checkout' }, { status: 400 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }

    if (order.paymentStatus === 'failed') {
      return NextResponse.json(
        { error: 'Payment failed for this order. Place a new order to try again.' },
        { status: 400 }
      );
    }

    const currency = BASE_CURRENCY;
    const total = Number(order.total);
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
    }

    if (currency.toUpperCase() === 'PHP' && total < PAYMONGO_MIN_AMOUNT_PHP) {
      return NextResponse.json(
        { error: `Minimum PayMongo payment is Php ${PAYMONGO_MIN_AMOUNT_PHP.toFixed(2)}.` },
        { status: 400 }
      );
    }

    const link = await createPaymongoPaymentLink({
      amount: total,
      currency,
      description: `XTS order ${orderId}`,
      metadata: { orderId },
    });

    await updateOrderPaymongoLinkId(orderId, link.id);

    return NextResponse.json({ checkoutUrl: link.checkoutUrl });
  } catch (err) {
    if (err instanceof PayMongoApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code ?? 'PAYMONGO_ERROR', detail: err.detail ?? null },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    const message = err instanceof Error ? err.message : 'Failed to create payment link';
    console.error('payments/create-link error:', message);
    return NextResponse.json(
      { error: 'Failed to create payment link', detail: message },
      { status: 500 }
    );
  }
}
