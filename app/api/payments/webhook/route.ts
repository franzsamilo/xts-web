import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymongoWebhookSignature } from '@/lib/paymongo';
import {
  getOrderById,
  markOrderPaidFromPaymongo,
  markOrderPaymentFailed,
} from '@/lib/orders';

const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

type PaymongoEventPayload = {
  data?: {
    attributes?: {
      type?: string;
      data?: {
        id?: string;
        attributes?: {
          status?: string;
          amount?: number;
          currency?: string;
          metadata?: Record<string, string>;
        };
      };
    };
  };
};

function isSuccessfulPaymentStatus(status: string | undefined): boolean {
  return status === 'paid' || status === 'succeeded' || status === 'captured';
}

function isFailedPaymentStatus(status: string | undefined): boolean {
  return status === 'failed' || status === 'cancelled';
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('paymongo-signature');
    const isValid = verifyPaymongoWebhookSignature({
      body: rawBody,
      signatureHeader,
      secret: PAYMONGO_WEBHOOK_SECRET,
    });
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PaymongoEventPayload;
    const paymentData = payload.data?.attributes?.data;
    const paymentId = paymentData?.id;
    const paymentStatus = paymentData?.attributes?.status;
    const metadata = paymentData?.attributes?.metadata;
    const orderId = metadata?.orderId;
    const amountMinor = paymentData?.attributes?.amount;

    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (order.paymentMethod !== 'gcash') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (typeof amountMinor === 'number' && Number.isFinite(amountMinor)) {
      const expectedMinor = Math.round(Number(order.total) * 100);
      if (expectedMinor !== amountMinor) {
        console.error('[payments/webhook] amount mismatch — possible tampering', {
          orderId,
          expectedMinor,
          amountMinor,
        });
        return NextResponse.json(
          { ok: false, reason: 'amount_mismatch' },
          { status: 400 }
        );
      }
    }

    if (isSuccessfulPaymentStatus(paymentStatus)) {
      await markOrderPaidFromPaymongo(orderId, paymentId);
    } else if (isFailedPaymentStatus(paymentStatus)) {
      await markOrderPaymentFailed(orderId, `PayMongo status: ${paymentStatus}`);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Webhook processing failed';
    console.error('payments/webhook error:', message);
    return NextResponse.json(
      { error: 'Webhook processing failed', detail: message },
      { status: 500 }
    );
  }
}
