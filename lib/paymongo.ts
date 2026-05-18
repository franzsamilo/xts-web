import type { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { PAYMONGO_MIN_AMOUNT_PHP as MIN_PHP } from '@/lib/currency';

export { MIN_PHP as PAYMONGO_MIN_AMOUNT_PHP };

const PAYMONGO_SECRET_KEY_LIVE = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_SECRET_KEY_TEST = process.env.PAYMONGO_SECRET_KEY_TEST;

const EFFECTIVE_PAYMONGO_SECRET_KEY =
  process.env.NODE_ENV === 'production'
    ? PAYMONGO_SECRET_KEY_LIVE
    : PAYMONGO_SECRET_KEY_TEST || PAYMONGO_SECRET_KEY_LIVE;

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1';

if (!EFFECTIVE_PAYMONGO_SECRET_KEY) {
  console.warn(
    '[paymongo] No PayMongo secret key configured. Set PAYMONGO_SECRET_KEY_TEST for dev or PAYMONGO_SECRET_KEY for production.'
  );
}

type PayMongoAttributes = Record<string, unknown>;

type PayMongoResponse<T extends PayMongoAttributes> = {
  data: {
    id: string;
    attributes: T;
  };
};

type PayMongoErrorResponse = {
  errors?: Array<{
    code?: string;
    detail?: string;
    source?: unknown;
  }>;
};

export class PayMongoApiError extends Error {
  status: number;
  code?: string;
  detail?: string;

  constructor(message: string, status: number, code?: string, detail?: string) {
    super(message);
    this.name = 'PayMongoApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

async function paymongoRequest<T extends PayMongoAttributes>(
  path: string,
  init: RequestInit
): Promise<PayMongoResponse<T>> {
  if (!EFFECTIVE_PAYMONGO_SECRET_KEY) {
    throw new Error('PayMongo is not configured. Missing PAYMONGO secret key.');
  }

  const res = await fetch(`${PAYMONGO_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${EFFECTIVE_PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[paymongo] API error', res.status, text);
    let parsed: PayMongoErrorResponse | null = null;
    try {
      parsed = JSON.parse(text) as PayMongoErrorResponse;
    } catch {
      parsed = null;
    }
    const firstError = parsed?.errors?.[0];
    const detail = firstError?.detail?.trim();
    const code = firstError?.code?.trim();
    const message =
      detail && detail.length > 0 ? detail : `PayMongo API error (${res.status})`;
    throw new PayMongoApiError(message, res.status, code, detail);
  }

  return (await res.json()) as PayMongoResponse<T>;
}

async function paymongoRawRequest(path: string, init: RequestInit): Promise<Response> {
  if (!EFFECTIVE_PAYMONGO_SECRET_KEY) {
    throw new Error('PayMongo is not configured. Missing PAYMONGO secret key.');
  }
  return fetch(`${PAYMONGO_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${EFFECTIVE_PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
      ...(init.headers || {}),
    },
  });
}

export type PaymongoBankOption = {
  code: string;
  name: string;
};

function parseBankItems(payload: unknown): PaymongoBankOption[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as { data?: unknown; results?: unknown };
  const rows = Array.isArray(root.data)
    ? root.data
    : Array.isArray(root.results)
      ? root.results
      : Array.isArray((root.data as { data?: unknown } | undefined)?.data)
        ? ((root.data as { data?: unknown }).data as unknown[])
        : [];
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item) => {
      const row = item as {
        id?: string;
        code?: string;
        name?: string;
        bank_code?: string;
        short_name?: string;
        display_name?: string;
        attributes?: {
          code?: string;
          bank_code?: string;
          name?: string;
          short_name?: string;
          display_name?: string;
        };
      };
      const code = (
        row.attributes?.code ??
        row.attributes?.bank_code ??
        row.code ??
        row.bank_code ??
        row.id ??
        ''
      ).trim();
      const name = (
        row.attributes?.name ??
        row.attributes?.display_name ??
        row.attributes?.short_name ??
        row.name ??
        row.display_name ??
        row.short_name ??
        ''
      ).trim();
      if (!code || !name) return null;
      return { code, name };
    })
    .filter((v): v is PaymongoBankOption => !!v);
}

export async function listPaymongoBanks(): Promise<PaymongoBankOption[]> {
  const candidatePaths = ['/banks', '/financial_institutions'];
  for (const path of candidatePaths) {
    try {
      const res = await paymongoRawRequest(path, { method: 'GET' });
      if (!res.ok) continue;
      const payload = (await res.json()) as unknown;
      const parsed = parseBankItems(payload);
      if (parsed.length > 0) {
        return parsed.sort((a, b) => a.name.localeCompare(b.name));
      }
    } catch {
      // Try next candidate path.
    }
  }
  return [];
}

export async function createPaymongoPaymentLink(params: {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}) {
  const { amount, currency, description, metadata } = params;
  const minorAmount = Math.round(amount * 100);

  const body = {
    data: {
      attributes: {
        amount: minorAmount,
        currency: currency.toLowerCase(),
        description,
        metadata,
      },
    },
  };

  type LinkAttributes = {
    amount: number;
    currency: string;
    description?: string;
    checkout_url: string;
  };

  const res = await paymongoRequest<LinkAttributes>('/links', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return {
    id: res.data.id,
    amount: res.data.attributes.amount,
    currency: res.data.attributes.currency,
    checkoutUrl: res.data.attributes.checkout_url,
  };
}

export async function createPaymongoPaymentIntent(params: {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  captureType?: 'automatic' | 'manual';
  paymentMethodAllowed?: string[];
}) {
  const {
    amount,
    currency,
    description,
    metadata,
    captureType = 'manual',
    paymentMethodAllowed = ['card', 'gcash', 'paymaya'],
  } = params;
  const minorAmount = Math.round(amount * 100);

  type PaymentIntentAttributes = {
    amount: number;
    currency: string;
    capture_type: 'automatic' | 'manual';
    status: string;
    client_key?: string;
    metadata?: Record<string, string>;
  };

  const body = {
    data: {
      attributes: {
        amount: minorAmount,
        currency: currency.toLowerCase(),
        capture_type: captureType,
        payment_method_allowed: paymentMethodAllowed,
        description,
        metadata,
      },
    },
  };

  const res = await paymongoRequest<PaymentIntentAttributes>('/payment_intents', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return {
    id: res.data.id,
    amount: res.data.attributes.amount,
    currency: res.data.attributes.currency,
    captureType: res.data.attributes.capture_type,
    status: res.data.attributes.status,
    clientKey: res.data.attributes.client_key ?? null,
    metadata: res.data.attributes.metadata ?? {},
  };
}

export async function capturePaymongoPaymentIntent(params: {
  paymentIntentId: string;
  amount?: number;
}) {
  const payload =
    params.amount != null
      ? {
          data: {
            attributes: {
              amount: Math.round(params.amount * 100),
            },
          },
        }
      : undefined;

  type CaptureAttributes = {
    status: string;
    amount: number;
    currency: string;
  };

  const res = await paymongoRequest<CaptureAttributes>(
    `/payment_intents/${params.paymentIntentId}/capture`,
    {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    }
  );

  return {
    id: res.data.id,
    status: res.data.attributes.status,
    amount: res.data.attributes.amount,
    currency: res.data.attributes.currency,
  };
}

/**
 * PayMongo webhook signing (official): HMAC-SHA256(whsk_secret, `${t}.${rawBody}`) as hex,
 * then compare to `te` (test) or `li` (live) from the Paymongo-Signature header.
 * @see https://developers.paymongo.com/docs/creating-webhook
 */
function parsePaymongoSignatureHeader(header: string): {
  t: string;
  te: string;
  li: string;
} | null {
  const parts: Record<string, string> = {};
  for (const segment of header.split(',')) {
    const i = segment.indexOf('=');
    if (i === -1) continue;
    const key = segment.slice(0, i).trim();
    parts[key] = segment.slice(i + 1).trim();
  }
  const t = parts.t;
  if (!t) return null;
  return { t, te: parts.te ?? '', li: parts.li ?? '' };
}

function timingSafeHexEqual(aHex: string, bHex: string): boolean {
  try {
    const a = Buffer.from(aHex, 'hex');
    const b = Buffer.from(bHex, 'hex');
    if (a.length !== b.length || a.length === 0) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyPaymongoWebhookSignature(params: {
  body: string;
  signatureHeader: string | null;
  secret: string | undefined;
}) {
  const { body, signatureHeader, secret } = params;
  if (!secret) return false;
  if (!signatureHeader) return false;

  const parsed = parsePaymongoSignatureHeader(signatureHeader.trim());
  if (!parsed) return false;

  const signedPayload = `${parsed.t}.${body}`;
  const expectedHex = createHmac('sha256', secret).update(signedPayload).digest('hex');

  // Legitimate events include only one of te / li (test vs live).
  return (
    (parsed.te.length > 0 && timingSafeHexEqual(expectedHex, parsed.te)) ||
    (parsed.li.length > 0 && timingSafeHexEqual(expectedHex, parsed.li))
  );
}

export async function createPaymongoPayout(params: {
  amount: number;
  currency: string;
  destination: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
  };
  metadata?: Record<string, string>;
}) {
  const body = {
    data: {
      attributes: {
        amount: Math.round(params.amount * 100),
        currency: params.currency.toLowerCase(),
        destination: {
          type: 'bank_account',
          attributes: {
            account_number: params.destination.accountNumber,
            account_name: params.destination.accountName,
            bank_code: params.destination.bankCode,
          },
        },
        metadata: params.metadata,
      },
    },
  };

  const res = await paymongoRawRequest('/payouts', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('[paymongo] payout API error', res.status, text);
    throw new Error(`PayMongo payout failed (${res.status})`);
  }
  const parsed = JSON.parse(text) as {
    data: { id: string; attributes?: Record<string, unknown> };
  };
  return {
    id: parsed.data.id,
    attributes: parsed.data.attributes ?? {},
  };
}

export async function readJsonBody<T>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}
