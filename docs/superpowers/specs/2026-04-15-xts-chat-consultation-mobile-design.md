# XTS Web — Chat Fixes, Admin Consultation, Mobile Responsiveness

**Date:** 2026-04-15
**Status:** Approved

---

## Overview

Three feature groups for the XTS Web platform:
1. Chat system fixes (scroll, delete, routing)
2. Admin consultation management with dedicated chat
3. Mobile responsiveness improvements

---

## Group 1: Chat Fixes

### 1a. Chat Scroll Fix

**Problem:** The chat message area grows infinitely, pushing the input box off-screen.

**Solution:**
- Chat page layout: `h-screen` minus navbar, using flexbox column
- Conversation list: fixed-width sidebar (hidden on mobile when chat is open)
- Message area: `flex-1 overflow-y-auto` — scrolls within its container
- Input box: pinned to bottom of the chat panel (not the page), never moves
- Auto-scroll to bottom on initial load and when new messages arrive
- Use `useRef` + `scrollIntoView` on a sentinel element at the bottom of the message list

### 1b. Delete Conversation (Soft Delete)

**Data model change:**
- Add `deletedBy: string[]` field to chat documents (default: empty array)
- When user deletes: add their email to `deletedBy`

**API:**
- `PATCH /api/chats/[id]` — new action `"delete"` adds current user's email to `deletedBy`
- Chat list query filters out chats where current user is in `deletedBy`

**UI:**
- Delete icon/button on each conversation in the sidebar list
- `ConfirmModal` before deletion: "Delete this conversation? It will be hidden from your view."
- After deletion: remove from local state, select next conversation or show empty state

**Edge cases:**
- If both participants delete, chat remains in Firestore (no hard delete)
- Existing chats without `deletedBy` field treated as empty array (no migration needed)

### 1c. Chat Seller Routing (Product Detail → Chat)

**Flow:**
1. User clicks "Chat Seller" on `/shop/[id]`
2. Client calls `GET /api/chats?participantA={userEmail}&participantB={sellerEmail}&productId={productId}`
3. If existing chat found → navigate to `/chat?id={chatId}`
4. If not found → `POST /api/chats` with type `product`, productRef, participants → navigate to `/chat?id={newChatId}`

**Seller resolution:**
- Use product's `sellerId` to look up seller email from `users` collection
- Fallback: if no `sellerId`, route to `ADMIN_INBOX_EMAIL`

**UI:**
- "Chat Seller" button remains on product detail page
- Loading state while checking/creating conversation
- Navigate to `/chat?id={chatId}` on completion

### 1d. Chat Pickup Routing (Cart → Chat)

**Flow:**
1. User clicks "Chat about Pickup" in cart
2. Same logic as 1c but with type `pickup` and `pickupRef` instead of `productRef`
3. Match on: current user + seller email + pickup point ID
4. Reuse or create, then navigate to `/chat?id={chatId}`

**Seller resolution:**
- Determine seller from the cart items (use `sellerId` from cart item)
- If multiple sellers in cart, route to the seller of the first item (or admin inbox if ambiguous)

---

## Group 2: Admin Consultation Management

### Consultation Status Flow

```
pending → confirmed → in-progress → completed
                   ↘ cancelled
```

Admin controls each transition via action buttons in the consultation row.

### Admin Consultation Tab Features

**Existing fields to manage:**
- View all consultations in a table/list
- consultationType, projectDescription, requiredSkills, customerName, customerEmail
- slot (date/time), status

**New admin actions:**
- **Assign Expert** — dropdown of users with `expert` role, saves to `expertName`/`expertId`
- **Set Price** — input field, saves to `expertPrice`
- **Change Status** — action buttons for each valid transition
- **Schedule Slot** — DateTimePicker to set/change the consultation slot
- **Open Consultation Chat** — inline chat panel within the admin tab

### Dedicated Consultation Chat

**Separation from regular chat:**
- Consultation messages stored as subcollection: `consultations/{consultationId}/messages/{messageId}`
- NOT stored in the `chats` collection — completely separate
- No mixing with product/support/pickup conversations

**Message schema** (under `consultations/{id}/messages`):
```
{
  senderId: string,       // user email
  senderName: string,
  content: string,
  createdAt: Timestamp
}
```

**Additional fields on consultation document:**
```
{
  lastMessage: string,
  lastMessageAt: Timestamp,
  lastReadByAdmin: Timestamp,
  lastReadByCustomer: Timestamp
}
```

**Admin UI:**
- Clicking a consultation row expands/opens an inline chat panel
- Messages displayed in scrollable area with input at bottom
- Poll-based refresh (same pattern as existing chat — every 5 seconds when open)

**Customer UI:**
- `/dashboard` page shows consultation chat for their active consultations
- Same inline chat component, scoped to their consultation ID
- Unread indicator if admin has replied since their last read

### API Endpoints

- `GET /api/consultations/[id]/messages` — fetch messages for a consultation
- `POST /api/consultations/[id]/messages` — send a message
- `PATCH /api/consultations/[id]` — update status, assign expert, set price, schedule slot

---

## Group 3: Mobile Responsiveness

### Priority Pages

#### Shop Page (`/shop`)
- **Card grid:** 2 columns on mobile (`grid-cols-2`), scaling up on larger screens
- **Card interaction:** Tap card to reveal Add to Cart button as a slide-up overlay within the card
- **Toast confirmation:** Mini popup/toast when item added to cart (product name, image, "Added to cart" text, auto-dismiss after 2 seconds)
- **Card content:** Truncate long product names, ensure price and image fit cleanly
- **Search/filter bar:** Stack vertically on mobile, full-width inputs

#### Product Detail (`/shop/[id]`)
- **Layout:** Single column on mobile — image gallery full-width, details below
- **Image gallery:** Horizontal scroll for thumbnails on mobile
- **Action buttons:** Sticky bottom bar with Add to Cart + Buy Now + Chat Seller
- **Specs table:** Scrollable horizontally if needed

#### Cart Page (`/cart`)
- **Layout:** Single column on mobile — items list, then order summary below
- **Order summary:** Collapsible or stacked below items (not sticky sidebar on mobile)
- **Item cards:** Compact layout with image, name, qty controls, price
- **Checkout buttons:** Full-width on mobile

### General Audit
- Fix any horizontal overflow on all user-facing pages
- Ensure navbar mobile menu works correctly
- Check text truncation and readability at small viewports
- Verify modals and toasts render correctly on mobile
- Test touch targets are at least 44x44px for buttons and interactive elements

---

## Out of Scope

- J&T Express / AfterShip delivery API integration (deferred)
- WebSocket migration for real-time chat (keep poll-based)
- Hard delete of conversations
- Admin/seller dashboard mobile optimization (user-facing pages only)

---

## Technical Notes

- **Framework:** Next.js 16 App Router, TypeScript, Tailwind CSS v4
- **Backend:** Firebase Firestore
- **Auth:** NextAuth.js with Google OAuth
- **Existing patterns:** Follow poll-based chat refresh, existing API route structure, ConfirmModal for destructive actions
- **No new dependencies** needed — all features buildable with existing stack
