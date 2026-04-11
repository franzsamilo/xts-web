/**
 * The shared "admin inbox" email used for chats addressed to staff and as the
 * default recipient for pickup-coordination/product-inquiry chats. Override via
 * NEXT_PUBLIC_ADMIN_EMAIL — falls back to admin@xts.com so existing chat docs
 * keep resolving.
 */
export const ADMIN_INBOX_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@xts.com';
