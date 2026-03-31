export const BASE_CURRENCY = process.env.NEXT_PUBLIC_BASE_CURRENCY || 'PHP';

/** PayMongo minimum charge in major units (e.g. PHP). */
export const PAYMONGO_MIN_AMOUNT_PHP = 100;

export function formatMoney(amount: number, currency: string = BASE_CURRENCY): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
