# XTS Chat Fixes, Admin Consultation, Mobile Responsiveness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix chat scrolling and deletion, wire up seller/pickup chat routing properly, build full admin consultation management with dedicated chat, and improve mobile responsiveness across shop/product/cart pages.

**Architecture:** Three independent feature groups: (1) Chat fixes modify the existing chat system — scroll layout, soft-delete conversion, and routing are all contained within `/app/chat/page.tsx`, `/lib/chat.ts`, and `/app/api/chats/` routes. (2) Admin consultation adds expert assignment, pricing, scheduling, and a dedicated consultation chat subcollection under `consultations/{id}/messages` — separate from the regular chat system. (3) Mobile responsiveness is a CSS-only pass on shop/product/cart pages.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Firebase Firestore, Framer Motion, NextAuth.js

---

## File Structure

### Group 1: Chat Fixes
- Modify: `app/chat/page.tsx` — scroll fix, soft-delete UI, updated delete modal text
- Modify: `lib/chat.ts` — `softDeleteChat()` replaces `deleteChat()`, update `getChatsByUser()` to filter `deletedBy`
- Modify: `app/api/chats/[id]/route.ts` — DELETE becomes soft-delete (adds to `deletedBy` array)
- Modify: `app/api/chats/route.ts` — POST now uses `findExistingChat` with pickup support
- Modify: `app/shop/[id]/page.tsx` — add loading state to Chat Seller button
- Modify: `app/cart/page.tsx` — pickup chat reuses existing conversation

### Group 2: Admin Consultation Management
- Modify: `lib/consultations.ts` — add `updateConsultation()` (multi-field), `getConsultationMessages()`, `addConsultationMessage()`, `getConsultationById()`
- Modify: `lib/types.ts` — add `ConsultationMessageDTO`
- Modify: `app/api/consultations/[id]/route.ts` — PATCH accepts expert/price/slot, add GET for messages
- Create: `app/api/consultations/[id]/messages/route.ts` — GET/POST for consultation chat messages
- Modify: `app/admin/page.tsx` — add expert assignment, pricing, scheduling, inline consultation chat
- Modify: `app/dashboard/page.tsx` — add consultation chat for customers

### Group 3: Mobile Responsiveness
- Modify: `app/shop/page.tsx` — tap-to-reveal add-to-cart overlay, add-to-cart toast
- Modify: `app/shop/[id]/page.tsx` — sticky bottom action bar, vertical stack on mobile
- Modify: `app/cart/page.tsx` — single-column mobile layout, order summary below items
- Modify: `app/globals.css` — add toast animation keyframes if needed

---

## Task 1: Chat Scroll Fix

**Files:**
- Modify: `app/chat/page.tsx:216-219`

The current chat page wraps everything in a `container` div with padding that allows the chat to extend beyond the viewport. The fix: make the entire chat page fill the viewport height minus the navbar, and ensure the message area scrolls internally.

- [ ] **Step 1: Fix the outer chat layout to fill viewport**

In `app/chat/page.tsx`, replace the outer wrapper (line 216-217):

```tsx
// OLD
<div className="container mx-auto px-4 py-16 sm:py-20">
  <SectionHeading title="Messages" annotation="Chat & Support" dark={true} />

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px] max-h-[calc(100vh-180px)]">
```

```tsx
// NEW
<div className="container mx-auto px-4 pt-16 sm:pt-20 pb-4 flex flex-col h-[calc(100vh-64px)]">
  <SectionHeading title="Messages" annotation="Chat & Support" dark={true} />

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
```

The key changes: `py-16` becomes `pt-16 pb-4` to reduce bottom padding, the outer div gets `flex flex-col` and a fixed height based on viewport minus navbar (64px). The grid gets `flex-1 min-h-0` so it fills remaining space and allows children to scroll. `min-h-0` is critical — without it, flex children won't shrink below their content height.

- [ ] **Step 2: Verify auto-scroll works on new messages**

The existing `messagesContainerRef` scrollTop logic on lines 78-80, 112-114, and 138-140 already handles this. Verify the `min-h-0` fix lets the container scroll properly. No code change needed — just a manual check.

- [ ] **Step 3: Commit**

```bash
git add app/chat/page.tsx
git commit -m "fix: make chat message area scrollable with pinned input box"
```

---

## Task 2: Soft-Delete Conversations

**Files:**
- Modify: `lib/chat.ts:35-63,154-162`
- Modify: `app/api/chats/[id]/route.ts:62-86`
- Modify: `app/chat/page.tsx:151-165,392-401`

### Step-by-step

- [ ] **Step 1: Update `getChatsByUser` to filter out soft-deleted chats**

In `lib/chat.ts`, modify the `getChatsByUser` function. After fetching chats, filter out any where the user's email appears in the `deletedBy` array:

```ts
// In getChatsByUser, after the snapshot.docs.map block (around line 43-58), wrap the return:
export async function getChatsByUser(userId: string): Promise<ChatData[]> {
  try {
    const snapshot = await adminDb
      .collection('chats')
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessageAt', 'desc')
      .get();

    const chats = snapshot.docs.map(doc => {
      const data = doc.data();
      const lastMessageAt = data.lastMessageAt?.toDate?.()?.toISOString?.() || new Date().toISOString();
      const lastReadBy = data.lastReadBy || {};
      const userLastRead = lastReadBy[userId];
      const hasUnread = !userLastRead || new Date(lastMessageAt) > new Date(userLastRead);

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        lastMessageAt,
        lastReadBy,
        hasUnread: data.lastMessage ? hasUnread : false,
      };
    }) as ChatData[];

    // Filter out chats soft-deleted by this user
    return chats.filter(chat => {
      const deletedBy: string[] = (chat as any).deletedBy || [];
      return !deletedBy.includes(userId);
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return [];
  }
}
```

- [ ] **Step 2: Add `softDeleteChat` function to `lib/chat.ts`**

Replace the existing `deleteChat` function (lines 154-162) with a soft-delete version:

```ts
export async function softDeleteChat(chatId: string, userId: string): Promise<void> {
  const { FieldValue } = await import('firebase-admin/firestore');
  await adminDb.collection('chats').doc(chatId).update({
    deletedBy: FieldValue.arrayUnion(userId),
  });
}
```

- [ ] **Step 3: Update the DELETE API route to use soft-delete**

In `app/api/chats/[id]/route.ts`, modify the DELETE handler:

```ts
import { getMessages, addMessage, getChatById, softDeleteChat, markChatAsRead } from '@/lib/chat';

// ... (keep GET and POST unchanged)

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const chat = await getChatById(id);
    if (!chat) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (!chat.participants.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await softDeleteChat(id, session.user.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Update the delete confirmation modal text in `app/chat/page.tsx`**

Change the `ConfirmModal` message (line 396):

```tsx
// OLD
message="This will permanently delete this conversation and all its messages. This cannot be undone."

// NEW
message="This conversation will be hidden from your view. The other participant can still see it."
```

- [ ] **Step 5: Commit**

```bash
git add lib/chat.ts app/api/chats/[id]/route.ts app/chat/page.tsx
git commit -m "feat: implement soft-delete for chat conversations"
```

---

## Task 3: Chat Seller Routing (Product Detail)

**Files:**
- Modify: `app/shop/[id]/page.tsx:69-103`

The existing `handleChatSeller` already calls `POST /api/chats` which internally uses `findExistingChat`. The `findExistingChat` function in `lib/chat.ts` already checks for matching `participantA + participantB + productId`. So the routing already works correctly — it reuses existing chats.

However, we should add a loading state to the button so the user knows something is happening.

- [ ] **Step 1: Add loading state to the Chat Seller button**

In `app/shop/[id]/page.tsx`, add a `chatLoading` state:

```tsx
// After the existing state declarations (around line 23)
const [chatLoading, setChatLoading] = useState(false);
```

Wrap the `handleChatSeller` function with loading state:

```tsx
const handleChatSeller = async () => {
  if (!session?.user?.email) {
    router.push('/login');
    return;
  }
  setChatLoading(true);
  try {
    const productPrice = parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const initialMessage = `Hi! I'm interested in this product:\n\n📦 ${product.name}\n🏷️ SKU: ${product.sku}\n💰 Price: ₱${productPrice}\n📂 Category: ${product.category}\n\nCould you help me with more details?`;

    const recipientId = product.sellerId || ADMIN_INBOX_EMAIL;

    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId,
        type: 'product',
        productRef: {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          imageUrl: product.imageUrls?.[0] || '',
        },
        initialMessage,
      }),
    });
    if (res.ok) {
      const chat = await res.json();
      router.push(`/chat?id=${chat.id}`);
    }
  } catch (e) {
    console.error('Failed to start chat', e);
  } finally {
    setChatLoading(false);
  }
};
```

Update the button to show loading:

```tsx
// Replace the Chat Seller button (around line 264-270)
<Button
  variant="outline"
  className="w-full h-10 sm:h-12 text-xs uppercase font-black tracking-wider flex items-center justify-center gap-2"
  onClick={handleChatSeller}
  disabled={chatLoading}
>
  {chatLoading ? (
    <><Activity className="w-4 h-4 animate-spin" /> Opening Chat...</>
  ) : (
    <><MessageCircle className="w-4 h-4" /> Chat Seller about this Product</>
  )}
</Button>
```

Add `Activity` to the imports if not already there:

```tsx
// In the imports (line 11), add Activity:
import { Box, ArrowLeft, ShieldCheck, Truck, RotateCcw, Activity, Check, ShoppingCart, MessageCircle, Star, Zap } from 'lucide-react';
```

- [ ] **Step 2: Commit**

```bash
git add app/shop/[id]/page.tsx
git commit -m "feat: add loading state to Chat Seller button"
```

---

## Task 4: Chat Pickup Routing (Cart)

**Files:**
- Modify: `lib/chat.ts:124-152`
- Modify: `app/cart/page.tsx:69-97`

The existing `handlePickupChat` in cart already calls `POST /api/chats` which uses `findExistingChat`. But `findExistingChat` currently only matches on `productRef.id` — it doesn't match on `pickupRef`. We need to extend it to also match pickup chats.

- [ ] **Step 1: Extend `findExistingChat` to support pickup matching**

In `lib/chat.ts`, update the `findExistingChat` function:

```ts
export async function findExistingChat(
  participantA: string,
  participantB: string,
  productId?: string,
  pickupPointId?: string
): Promise<ChatData | null> {
  try {
    const query = adminDb
      .collection('chats')
      .where('participants', 'array-contains', participantA);

    const snapshot = await query.get();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.participants.includes(participantB)) continue;

      // Match product chats by productRef.id
      if (productId && data.productRef?.id === productId) {
        return { id: doc.id, ...data } as ChatData;
      }
      // Match pickup chats by pickupRef.pointId
      if (pickupPointId && data.pickupRef?.pointId === pickupPointId) {
        return { id: doc.id, ...data } as ChatData;
      }
      // Match generic chats (no product, no pickup)
      if (!productId && !pickupPointId && !data.productRef && !data.pickupRef) {
        return { id: doc.id, ...data } as ChatData;
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding chat:', error);
    return null;
  }
}
```

- [ ] **Step 2: Update `POST /api/chats` to pass pickupRef.pointId to findExistingChat**

In `app/api/chats/route.ts`, update the `findExistingChat` call (around line 82-86):

```ts
// OLD
const existingChat = await findExistingChat(
  session.user.email,
  recipientId,
  body?.productRef?.id
);

// NEW
const existingChat = await findExistingChat(
  session.user.email,
  recipientId,
  body?.productRef?.id,
  body?.pickupRef?.pointId
);
```

- [ ] **Step 3: Add loading state to pickup chat button in cart**

In `app/cart/page.tsx`, add state and update the handler:

```tsx
// After the existing state declarations (around line 30)
const [pickupChatLoading, setPickupChatLoading] = useState(false);
```

Wrap `handlePickupChat`:

```tsx
const handlePickupChat = async () => {
  if (!session || !selectedPickup) return;
  setPickupChatLoading(true);
  try {
    const firstSeller = items.find(i => i.sellerId)?.sellerId;
    const recipientId = firstSeller || ADMIN_INBOX_EMAIL;

    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId,
        type: 'pickup',
        initialMessage: `Hi! I'd like to arrange pickup at ${selectedPickup.name} (${selectedPickup.address}). I have ${cartCount} item(s) totaling ₱${cartTotal.toLocaleString()}.`,
        pickupRef: {
          pointId: selectedPickup.id,
          pointName: selectedPickup.name,
          pointAddress: selectedPickup.address,
        },
      }),
    });
    if (res.ok) {
      const chat = await res.json();
      router.push(`/chat?id=${chat.id}`);
    }
  } catch (e) {
    console.error('Failed to create pickup chat', e);
  } finally {
    setPickupChatLoading(false);
  }
};
```

Update the pickup chat button (around line 471-478):

```tsx
<button
  onClick={handlePickupChat}
  disabled={pickupChatLoading}
  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-sm text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
>
  {pickupChatLoading ? (
    <><Activity className="w-4 h-4 animate-spin" /><span className="text-xs font-black uppercase tracking-widest">Opening Chat...</span></>
  ) : (
    <><MessageCircle className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-widest">Chat about Pickup</span></>
  )}
</button>
```

Add `Activity` to the cart imports:

```tsx
import { Minus, Plus, X, ShoppingCart, Package, ArrowRight, Trash2, CheckCircle2, Activity, Truck, MapPin, CreditCard, Banknote, MessageCircle } from 'lucide-react';
```

(Activity is already imported — verify it's there.)

- [ ] **Step 4: Commit**

```bash
git add lib/chat.ts app/api/chats/route.ts app/cart/page.tsx
git commit -m "feat: reuse existing pickup chats and add loading states"
```

---

## Task 5: Admin Consultation — Expert Assignment, Pricing, Scheduling

**Files:**
- Modify: `lib/consultations.ts` — add `updateConsultationFields()`, `getConsultationById()`
- Modify: `app/api/consultations/[id]/route.ts` — PATCH accepts multiple fields
- Modify: `app/admin/page.tsx:828-993` — add expert dropdown, price input, slot picker in detail modal

- [ ] **Step 1: Add `updateConsultationFields` and `getConsultationById` to `lib/consultations.ts`**

Append to `lib/consultations.ts`:

```ts
export async function updateConsultationFields(
  id: string,
  fields: Partial<Pick<ConsultationData, 'expertName' | 'expertTitle' | 'expertPrice' | 'slot' | 'status'>> & { expertId?: string }
): Promise<void> {
  const update: Record<string, any> = {};
  if (fields.expertName !== undefined) update.expertName = fields.expertName;
  if (fields.expertTitle !== undefined) update.expertTitle = fields.expertTitle;
  if (fields.expertPrice !== undefined) update.expertPrice = fields.expertPrice;
  if (fields.slot !== undefined) update.slot = fields.slot;
  if (fields.status !== undefined) update.status = fields.status;
  if (fields.expertId !== undefined) update.expertId = fields.expertId;
  if (Object.keys(update).length === 0) return;
  await adminDb.collection('consultations').doc(id).update(update);
}

export async function getConsultationById(id: string): Promise<ConsultationData | null> {
  try {
    const doc = await adminDb.collection('consultations').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    } as ConsultationData;
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return null;
  }
}
```

- [ ] **Step 2: Update PATCH `/api/consultations/[id]` to accept multiple fields**

Replace the entire file `app/api/consultations/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { updateConsultationStatus, updateConsultationFields } from '@/lib/consultations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'in-progress'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any)?.role || '';
  if (!role.includes('admin') && !role.includes('expert')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // If only status is provided, use the simple update
    if (body.status && Object.keys(body).length === 1) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      await updateConsultationStatus(id, body.status);
      return NextResponse.json({ success: true });
    }

    // Multi-field update
    const fields: Record<string, any> = {};
    if (body.status && VALID_STATUSES.includes(body.status)) fields.status = body.status;
    if (typeof body.expertName === 'string') fields.expertName = body.expertName;
    if (typeof body.expertTitle === 'string') fields.expertTitle = body.expertTitle;
    if (typeof body.expertPrice === 'string') fields.expertPrice = body.expertPrice;
    if (typeof body.expertId === 'string') fields.expertId = body.expertId;
    if (typeof body.slot === 'string') fields.slot = body.slot;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await updateConsultationFields(id, fields);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update consultation' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add expert assignment, price, and slot editing to admin consultation detail modal**

In `app/admin/page.tsx`, the consultation detail modal starts at line 902. We need to add:
1. State for editing fields
2. Expert dropdown (filtered from users with `expert` role)
3. Price input
4. Slot/schedule input
5. Save button

Add new state after the existing consultation state (around line 41):

```tsx
const [consultationEdits, setConsultationEdits] = React.useState<{
  expertName: string;
  expertId: string;
  expertPrice: string;
  slot: string;
} | null>(null);
const [savingConsultation, setSavingConsultation] = React.useState(false);
```

Add a handler for saving consultation edits:

```tsx
const saveConsultationEdits = async () => {
  if (!selectedConsultation || !consultationEdits) return;
  setSavingConsultation(true);
  try {
    const res = await fetch(`/api/consultations/${selectedConsultation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultationEdits),
    });
    if (res.ok) {
      const updated = { ...selectedConsultation, ...consultationEdits };
      setConsultations(prev => prev.map(c => c.id === selectedConsultation.id ? updated : c));
      setSelectedConsultation(updated);
      setConsultationEdits(null);
    }
  } catch (e) {
    console.error('Failed to save consultation edits', e);
  } finally {
    setSavingConsultation(false);
  }
};
```

Update the `setSelectedConsultation` call in the Details button to also init edits:

```tsx
// Replace the Details button onClick (line 886)
<Button variant="outline" className="flex-grow uppercase font-black text-[10px]" onClick={() => {
  setSelectedConsultation(consult);
  setConsultationEdits({
    expertName: consult.expertName || '',
    expertId: consult.expertId || '',
    expertPrice: consult.expertPrice || '',
    slot: consult.slot || '',
  });
}}>Details</Button>
```

In the detail modal (after the grid with Client/Expert around line 930-941), add editable fields:

```tsx
{/* Editable Fields */}
{consultationEdits && (selectedConsultation.status === 'pending' || selectedConsultation.status === 'confirmed') && (
  <div className="space-y-4 p-4 bg-black/20 rounded-sm border border-white/5">
    <p className="text-[10px] font-black text-safety-orange uppercase tracking-widest">Edit Session</p>
    
    {/* Expert Assignment */}
    <div>
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Assign Expert</label>
      <select
        value={consultationEdits.expertId}
        onChange={(e) => {
          const expert = users.find((u: any) => u.id === e.target.value);
          setConsultationEdits(prev => prev ? {
            ...prev,
            expertId: e.target.value,
            expertName: expert?.name || expert?.email || '',
          } : null);
        }}
        className="w-full h-10 px-3 bg-zinc-800 border border-white/10 rounded-sm text-sm text-white"
      >
        <option value="">Select an expert...</option>
        {users.filter((u: any) => u.role?.includes('expert')).map((u: any) => (
          <option key={u.id} value={u.id}>{u.name || u.email}</option>
        ))}
      </select>
    </div>

    {/* Price */}
    <div>
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Session Price</label>
      <Input
        value={consultationEdits.expertPrice}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsultationEdits(prev => prev ? { ...prev, expertPrice: e.target.value } : null)}
        placeholder="e.g. ₱500/hr"
        className="bg-zinc-800 border-white/10 text-white"
      />
    </div>

    {/* Schedule */}
    <div>
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Schedule / Slot</label>
      <Input
        value={consultationEdits.slot}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsultationEdits(prev => prev ? { ...prev, slot: e.target.value } : null)}
        placeholder="e.g. 2026-04-20 2:00 PM"
        className="bg-zinc-800 border-white/10 text-white"
      />
    </div>

    <Button
      className="w-full bg-safety-orange hover:bg-safety-orange/80 uppercase font-black text-[10px]"
      onClick={saveConsultationEdits}
      disabled={savingConsultation}
    >
      {savingConsultation ? 'Saving...' : 'Save Changes'}
    </Button>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add lib/consultations.ts app/api/consultations/[id]/route.ts app/admin/page.tsx
git commit -m "feat: admin consultation expert assignment, pricing, and scheduling"
```

---

## Task 6: Dedicated Consultation Chat

**Files:**
- Modify: `lib/consultations.ts` — add message functions
- Modify: `lib/types.ts` — add `ConsultationMessageDTO`
- Create: `app/api/consultations/[id]/messages/route.ts` — GET/POST
- Modify: `app/admin/page.tsx` — inline chat in detail modal
- Modify: `app/dashboard/page.tsx` — consultation chat for customers

- [ ] **Step 1: Add consultation message functions to `lib/consultations.ts`**

Append to `lib/consultations.ts`:

```ts
export interface ConsultationMessage {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date | any;
}

export async function getConsultationMessages(consultationId: string): Promise<ConsultationMessage[]> {
  try {
    const snapshot = await adminDb
      .collection('consultations')
      .doc(consultationId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as ConsultationMessage[];
  } catch (error) {
    console.error('Error fetching consultation messages:', error);
    return [];
  }
}

export async function addConsultationMessage(
  consultationId: string,
  message: Omit<ConsultationMessage, 'id'>
): Promise<ConsultationMessage> {
  const docRef = await adminDb
    .collection('consultations')
    .doc(consultationId)
    .collection('messages')
    .add({
      ...message,
      createdAt: new Date(),
    });

  // Update last message on the consultation document
  await adminDb.collection('consultations').doc(consultationId).update({
    lastMessage: message.content,
    lastMessageAt: new Date(),
  });

  return { id: docRef.id, ...message };
}
```

- [ ] **Step 2: Add `ConsultationMessageDTO` to `lib/types.ts`**

Append after `ConsultationDTO`:

```ts
export interface ConsultationMessageDTO {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}
```

- [ ] **Step 3: Create `app/api/consultations/[id]/messages/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getConsultationMessages, addConsultationMessage, getConsultationById } from '@/lib/consultations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const consultation = await getConsultationById(id);
    if (!consultation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Only the client, assigned expert, or admin can view messages
    const role = (session.user as any)?.role || '';
    const isParticipant =
      consultation.clientEmail === session.user.email ||
      role.includes('admin') ||
      role.includes('expert');

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await getConsultationMessages(id);
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const consultation = await getConsultationById(id);
    if (!consultation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const role = (session.user as any)?.role || '';
    const isParticipant =
      consultation.clientEmail === session.user.email ||
      role.includes('admin') ||
      role.includes('expert');

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    const message = await addConsultationMessage(id, {
      senderId: session.user.email,
      senderName: session.user.name || 'User',
      content: content.slice(0, 2000),
      createdAt: new Date(),
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Add inline consultation chat to the admin detail modal**

In `app/admin/page.tsx`, add consultation chat state:

```tsx
// After the existing consultation state (around line 41)
const [consultationMessages, setConsultationMessages] = React.useState<any[]>([]);
const [loadingConsultationMessages, setLoadingConsultationMessages] = React.useState(false);
const [newConsultationMessage, setNewConsultationMessage] = React.useState('');
const [sendingConsultationMessage, setSendingConsultationMessage] = React.useState(false);
const consultationMessagesEndRef = React.useRef<HTMLDivElement>(null);
const consultationMessagesContainerRef = React.useRef<HTMLDivElement>(null);
```

Add fetch/send functions:

```tsx
const fetchConsultationMessages = async (consultationId: string) => {
  setLoadingConsultationMessages(true);
  try {
    const res = await fetch(`/api/consultations/${consultationId}/messages`);
    if (res.ok) {
      const msgs = await res.json();
      setConsultationMessages(msgs);
      setTimeout(() => {
        if (consultationMessagesContainerRef.current) {
          consultationMessagesContainerRef.current.scrollTop = consultationMessagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  } catch (e) {
    console.error('Failed to fetch consultation messages', e);
  } finally {
    setLoadingConsultationMessages(false);
  }
};

const sendConsultationMessage = async () => {
  if (!newConsultationMessage.trim() || !selectedConsultation) return;
  setSendingConsultationMessage(true);
  try {
    const res = await fetch(`/api/consultations/${selectedConsultation.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newConsultationMessage.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setConsultationMessages(prev => [...prev, { ...msg, createdAt: new Date().toISOString() }]);
      setNewConsultationMessage('');
      setTimeout(() => {
        if (consultationMessagesContainerRef.current) {
          consultationMessagesContainerRef.current.scrollTop = consultationMessagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  } catch (e) {
    console.error('Failed to send consultation message', e);
  } finally {
    setSendingConsultationMessage(false);
  }
};
```

Update the Details button to also fetch messages when opening the modal:

```tsx
// Update the Details button onClick to also fetch messages
<Button variant="outline" className="flex-grow uppercase font-black text-[10px]" onClick={() => {
  setSelectedConsultation(consult);
  setConsultationEdits({
    expertName: consult.expertName || '',
    expertId: consult.expertId || '',
    expertPrice: consult.expertPrice || '',
    slot: consult.slot || '',
  });
  fetchConsultationMessages(consult.id);
}}>Details</Button>
```

Add the chat UI at the bottom of the detail modal content (before the closing `</div>` of the modal's scrollable area, before the Actions section around line 972):

```tsx
{/* Consultation Chat */}
<div>
  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Consultation Chat</p>
  <div className="border border-white/5 rounded-sm overflow-hidden bg-black/20">
    {/* Messages */}
    <div
      ref={consultationMessagesContainerRef}
      className="h-48 overflow-y-auto p-3 space-y-2"
    >
      {loadingConsultationMessages ? (
        <div className="flex justify-center py-6"><Activity className="w-5 h-5 text-safety-orange animate-spin" /></div>
      ) : consultationMessages.length > 0 ? (
        consultationMessages.map((msg: any) => {
          const isAdmin = msg.senderId === session?.user?.email;
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-sm ${
                isAdmin ? 'bg-safety-orange text-white' : 'bg-zinc-800 text-zinc-300 border border-white/5'
              }`}>
                <p className="text-xs">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${isAdmin ? 'text-white/50' : 'text-zinc-600'}`}>
                  {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center text-[10px] text-zinc-600 py-6">No messages yet. Start the conversation.</p>
      )}
      <div ref={consultationMessagesEndRef} />
    </div>
    {/* Input */}
    <div className="p-2 border-t border-white/5 flex gap-2">
      <Input
        placeholder="Type a message..."
        value={newConsultationMessage}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewConsultationMessage(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendConsultationMessage(); } }}
        className="flex-grow h-9 text-xs bg-zinc-800 border-white/10 text-white"
      />
      <Button
        size="sm"
        className="px-3 h-9"
        onClick={sendConsultationMessage}
        disabled={!newConsultationMessage.trim() || sendingConsultationMessage}
      >
        <Send className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
</div>
```

Add `Send` to the admin page's lucide imports:

```tsx
// In the imports line 12, add Send:
import { Package, Users, Activity, Settings, Plus, Search, Hammer, AlertTriangle, MessageCircle, X, ClipboardList, Truck, CheckCircle2, ArrowUpDown, MapPin, Trash2, Edit2, Download, Send } from 'lucide-react';
```

- [ ] **Step 5: Add consultation chat to the customer dashboard**

In `app/dashboard/page.tsx`, add a consultation chat section in the consultations tab. This involves:
1. Adding state for selected consultation and messages
2. Adding fetch/send message functions (same pattern as admin)
3. Rendering an expandable chat panel for each consultation

The dashboard consultation section needs to be located first. Add the following state after existing state declarations:

```tsx
const [selectedConsultChat, setSelectedConsultChat] = React.useState<string | null>(null);
const [consultMessages, setConsultMessages] = React.useState<any[]>([]);
const [loadingConsultMsgs, setLoadingConsultMsgs] = React.useState(false);
const [newConsultMsg, setNewConsultMsg] = React.useState('');
const [sendingConsultMsg, setSendingConsultMsg] = React.useState(false);
const consultMsgsRef = React.useRef<HTMLDivElement>(null);
```

Add functions:

```tsx
const openConsultChat = async (consultationId: string) => {
  setSelectedConsultChat(consultationId);
  setLoadingConsultMsgs(true);
  try {
    const res = await fetch(`/api/consultations/${consultationId}/messages`);
    if (res.ok) {
      const msgs = await res.json();
      setConsultMessages(msgs);
      setTimeout(() => {
        if (consultMsgsRef.current) consultMsgsRef.current.scrollTop = consultMsgsRef.current.scrollHeight;
      }, 100);
    }
  } catch (e) {
    console.error('Failed to fetch consultation messages', e);
  } finally {
    setLoadingConsultMsgs(false);
  }
};

const sendConsultMsg = async () => {
  if (!newConsultMsg.trim() || !selectedConsultChat) return;
  setSendingConsultMsg(true);
  try {
    const res = await fetch(`/api/consultations/${selectedConsultChat}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newConsultMsg.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setConsultMessages(prev => [...prev, { ...msg, createdAt: new Date().toISOString() }]);
      setNewConsultMsg('');
      setTimeout(() => {
        if (consultMsgsRef.current) consultMsgsRef.current.scrollTop = consultMsgsRef.current.scrollHeight;
      }, 100);
    }
  } catch (e) {
    console.error('Failed to send message', e);
  } finally {
    setSendingConsultMsg(false);
  }
};
```

For each consultation card in the dashboard, add a "Chat" button and expandable chat panel:

```tsx
{/* Add after the consultation status/details in each card */}
<Button
  variant="outline"
  size="sm"
  className="mt-3 w-full text-[10px] uppercase font-black"
  onClick={() => selectedConsultChat === consult.id ? setSelectedConsultChat(null) : openConsultChat(consult.id)}
>
  <MessageCircle className="w-3 h-3 mr-1" />
  {selectedConsultChat === consult.id ? 'Close Chat' : 'Chat with Expert'}
</Button>

{selectedConsultChat === consult.id && (
  <div className="mt-3 border border-[var(--border-primary)] rounded-sm overflow-hidden">
    <div ref={consultMsgsRef} className="h-40 overflow-y-auto p-3 space-y-2 bg-[var(--bg-surface)]">
      {loadingConsultMsgs ? (
        <div className="flex justify-center py-4"><Activity className="w-5 h-5 text-safety-orange animate-spin" /></div>
      ) : consultMessages.length > 0 ? (
        consultMessages.map((msg: any) => {
          const isMe = msg.senderId === session?.user?.email;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-sm ${
                isMe ? 'bg-safety-orange text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]'
              }`}>
                <p className="text-xs">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${isMe ? 'text-white/50' : 'text-[var(--text-muted)]'}`}>
                  {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center text-[10px] text-[var(--text-muted)] py-4">No messages yet.</p>
      )}
    </div>
    <div className="p-2 border-t border-[var(--border-primary)] flex gap-2 bg-[var(--bg-surface)]">
      <Input
        placeholder="Type a message..."
        value={newConsultMsg}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewConsultMsg(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendConsultMsg(); } }}
        className="flex-grow h-8 text-xs"
      />
      <Button size="sm" className="px-3 h-8" onClick={sendConsultMsg} disabled={!newConsultMsg.trim() || sendingConsultMsg}>
        <Send className="w-3 h-3" />
      </Button>
    </div>
  </div>
)}
```

Add `Send` to the dashboard imports.

- [ ] **Step 6: Commit**

```bash
git add lib/consultations.ts lib/types.ts app/api/consultations/[id]/messages/route.ts app/admin/page.tsx app/dashboard/page.tsx
git commit -m "feat: dedicated consultation chat for admin and customers"
```

---

## Task 7: Mobile Responsiveness — Shop Cards (Tap-to-Reveal + Toast)

**Files:**
- Modify: `app/shop/page.tsx`

- [ ] **Step 1: Add toast state and tap-to-reveal overlay**

In `app/shop/page.tsx`, add state for the tapped card and toast:

```tsx
// After addedIds state (around line 22)
const [tappedId, setTappedId] = useState<string | null>(null);
const [toastItem, setToastItem] = useState<{ name: string; imageUrl: string } | null>(null);
```

Update `handleAddToCart` to also show toast:

```tsx
const handleAddToCart = (product: ProductDTO) => {
  addToCart({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    category: product.category,
    sku: product.sku,
    tag: product.tag,
    imageUrl: product.imageUrls?.[0] || '',
    sellerId: product.sellerId || undefined,
  });
  setAddedIds(prev => new Set(prev).add(product.id));
  setTappedId(null);
  // Show toast
  setToastItem({ name: product.name, imageUrl: product.imageUrls?.[0] || '' });
  setTimeout(() => setToastItem(null), 2000);
  setTimeout(() => {
    setAddedIds(prev => { const n = new Set(prev); n.delete(product.id); return n; });
  }, 2000);
};
```

- [ ] **Step 2: Refactor the product card to support tap-to-reveal on mobile**

Replace the product card rendering (the `motion.div` inside the filtered map, around lines 118-186):

```tsx
<motion.div key={product.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="min-w-0">
  <div className="group relative h-full flex flex-col">
    <div
      className="flex-grow min-w-0 cursor-pointer"
      onClick={(e) => {
        // On mobile: tap toggles overlay. On desktop: navigate
        if (window.innerWidth < 640) {
          e.preventDefault();
          setTappedId(prev => prev === product.id ? null : product.id);
        }
      }}
    >
      <Link
        href={`/shop/${product.id}`}
        className="block h-full"
        onClick={(e) => {
          // Prevent navigation on mobile tap (overlay mode)
          if (window.innerWidth < 640 && tappedId !== product.id) {
            e.preventDefault();
          }
        }}
      >
        <Card hoverEffect={false} className="transition-transform duration-200 sm:group-hover:scale-[1.02] sm:group-hover:-translate-y-1 h-full flex flex-col overflow-hidden relative">
          {/* Image */}
          <div className="aspect-square bg-[var(--bg-surface)] rounded-sm overflow-hidden mb-2 sm:mb-3 relative border border-[var(--border-secondary)] shrink-0">
            {product.imageUrls?.[0] ? (
              <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Box className="w-10 h-10 sm:w-16 sm:h-16 text-[var(--text-muted)] opacity-20" />
              </div>
            )}
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
              <Badge variant="new" className="text-[7px] sm:text-[9px] px-1 sm:px-1.5 border-none bg-safety-orange">{product.tag}</Badge>
            </div>
            {product.stock <= 5 && product.stock > 0 && (
              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                <Badge variant="warning" className="text-[7px] sm:text-[8px] px-1 sm:px-1.5">Low Stock</Badge>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col flex-grow min-w-0">
            <p className="text-[8px] sm:text-[10px] font-bold text-[var(--text-on-card-muted)] uppercase tracking-widest mb-0.5 truncate">{product.category}</p>
            <h3 className="text-[11px] sm:text-sm font-black text-[var(--text-on-card)] uppercase leading-tight mb-1 sm:mb-1.5 line-clamp-2 group-hover:text-safety-orange transition-colors">{product.name}</h3>

            {/* Rating & Sold */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              {product.rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500 fill-current" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-[var(--text-on-card-secondary)]">{product.rating}</span>
                </div>
              )}
              {product.totalSold != null && product.totalSold > 0 && (
                <span className="text-[9px] sm:text-[10px] text-[var(--text-on-card-muted)]">{product.totalSold} sold</span>
              )}
            </div>

            <div className="flex items-end justify-between mt-auto">
              <span className="text-sm sm:text-lg font-black text-[var(--text-on-card)]">₱{Number(product.price).toLocaleString()}</span>
            </div>
          </div>

          {/* Mobile tap-to-reveal overlay */}
          <AnimatePresence>
            {tappedId === product.id && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 pt-10 sm:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                  disabled={product.stock <= 0}
                  className="w-full py-2.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-safety-orange text-white active:scale-95 transition-transform disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </span>
                </button>
                <Link
                  href={`/shop/${product.id}`}
                  className="block w-full mt-2 py-2 rounded-sm text-[10px] font-black uppercase tracking-wider text-center border border-white/20 text-white active:bg-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </Link>
    </div>
    {/* Desktop Add to Cart Button (hidden on mobile) */}
    <div className="mt-1.5 sm:mt-2 shrink-0 hidden sm:block">
      <button
        onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
        disabled={product.stock <= 0}
        className={`w-full py-2 sm:py-2.5 rounded-sm text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all ${
          addedIds.has(product.id)
            ? 'bg-green-600 text-white'
            : product.stock <= 0
              ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed'
              : 'bg-safety-orange text-white hover:bg-safety-orange/80 active:scale-95'
        }`}
      >
        {addedIds.has(product.id) ? (
          <span className="flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Added</span>
        ) : product.stock <= 0 ? 'Out of Stock' : (
          <span className="flex items-center justify-center gap-1"><ShoppingCart className="w-3 h-3" /> Add</span>
        )}
      </button>
    </div>
  </div>
</motion.div>
```

- [ ] **Step 3: Add the toast notification**

At the end of the return, just before the closing `</PageShell>`, add:

```tsx
{/* Add to Cart Toast */}
<AnimatePresence>
  {toastItem && (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm shadow-2xl px-4 py-3"
    >
      {toastItem.imageUrl ? (
        <img src={toastItem.imageUrl} alt="" className="w-10 h-10 rounded-sm object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-sm bg-[var(--bg-secondary)] flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-safety-orange" />
        </div>
      )}
      <div>
        <p className="text-xs font-black text-[var(--text-primary)] uppercase line-clamp-1">{toastItem.name}</p>
        <p className="text-[10px] text-green-500 font-bold">Added to cart</p>
      </div>
      <Check className="w-5 h-5 text-green-500 ml-2" />
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 4: Dismiss overlay when clicking outside**

Add an effect to close the overlay when clicking outside or scrolling:

```tsx
// After the tappedId state declaration
useEffect(() => {
  if (!tappedId) return;
  const dismiss = () => setTappedId(null);
  window.addEventListener('scroll', dismiss);
  return () => window.removeEventListener('scroll', dismiss);
}, [tappedId]);
```

- [ ] **Step 5: Commit**

```bash
git add app/shop/page.tsx
git commit -m "feat: mobile tap-to-reveal add-to-cart with toast notification"
```

---

## Task 8: Mobile Responsiveness — Product Detail Page

**Files:**
- Modify: `app/shop/[id]/page.tsx`

- [ ] **Step 1: Add sticky bottom action bar for mobile**

The current action buttons (lines 239-271) are inline. On mobile, add a sticky bottom bar:

After the closing `</div>` of the grid container (after line 273), add:

```tsx
{/* Mobile Sticky Action Bar */}
<div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] p-3 flex gap-2 sm:hidden">
  <Button
    className={`flex-1 h-11 text-xs uppercase font-black tracking-wider ${
      added
        ? 'bg-green-600 hover:bg-green-600'
        : 'bg-safety-orange hover:bg-safety-orange/80'
    }`}
    onClick={handleAddToCart}
    disabled={product.stock <= 0}
  >
    {added ? <><Check className="w-3.5 h-3.5 mr-1" /> Added</> : <><ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add</>}
  </Button>
  <Button
    className="flex-1 h-11 text-xs uppercase font-black tracking-wider bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90"
    onClick={handleBuyNow}
    disabled={product.stock <= 0}
  >
    <Zap className="w-3.5 h-3.5 mr-1" /> Buy
  </Button>
  <Button
    variant="outline"
    className="h-11 px-3"
    onClick={handleChatSeller}
    disabled={chatLoading}
  >
    <MessageCircle className="w-4 h-4" />
  </Button>
</div>
```

Add bottom padding to the page content so it doesn't get hidden behind the sticky bar:

```tsx
// In the outer container div (line 131), add pb-20 for mobile:
<div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 pb-24 sm:pb-20">
```

- [ ] **Step 2: Commit**

```bash
git add app/shop/[id]/page.tsx
git commit -m "feat: sticky mobile action bar on product detail page"
```

---

## Task 9: Mobile Responsiveness — Cart Page

**Files:**
- Modify: `app/cart/page.tsx`

- [ ] **Step 1: Fix order summary for mobile — non-sticky on small screens**

The order summary sidebar (line 568-692) uses `sticky top-32`. On mobile, it should just flow normally below the items. Update the sticky wrapper:

```tsx
// OLD (line 569)
<div className="sticky top-32">

// NEW
<div className="lg:sticky lg:top-32">
```

This makes the sidebar only sticky on large screens, flowing normally on mobile.

- [ ] **Step 2: Improve cart item layout for small screens**

The cart items already use `flex-col sm:flex-row` which stacks on mobile. No changes needed — this already works.

- [ ] **Step 3: Commit**

```bash
git add app/cart/page.tsx
git commit -m "fix: cart order summary non-sticky on mobile"
```

---

## Task 10: Mobile Responsiveness — General Audit

**Files:**
- Modify: `app/chat/page.tsx` — ensure mobile chat fills screen
- Modify: `app/community/page.tsx` — check for overflow
- Modify: `app/consultation/page.tsx` — check for overflow

- [ ] **Step 1: Fix chat page mobile layout**

The chat page already hides the sidebar when a chat is selected on mobile (`hidden lg:flex`). Ensure the chat window takes full height on mobile. The scroll fix from Task 1 already handles this.

Verify the back button (line 295-297) works to go back to the conversation list on mobile. This already exists:

```tsx
<button onClick={() => setSelectedChat(null)} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
  <ArrowLeft className="w-5 h-5" />
</button>
```

No changes needed for chat mobile layout — the scroll fix from Task 1 is sufficient.

- [ ] **Step 2: Check community and consultation pages for mobile issues**

Read `app/community/page.tsx` and `app/consultation/page.tsx` to verify no horizontal overflow. Fix any issues found. Common fixes:
- Add `overflow-hidden` or `overflow-x-hidden` to containers
- Ensure text uses `truncate` or `break-words` where needed
- Ensure grids use `grid-cols-1` as mobile default

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: mobile responsiveness audit across pages"
```

---

## Summary

| Task | Feature | Files Changed |
|------|---------|---------------|
| 1 | Chat scroll fix | `app/chat/page.tsx` |
| 2 | Soft-delete conversations | `lib/chat.ts`, `app/api/chats/[id]/route.ts`, `app/chat/page.tsx` |
| 3 | Chat Seller loading state | `app/shop/[id]/page.tsx` |
| 4 | Pickup chat routing + reuse | `lib/chat.ts`, `app/api/chats/route.ts`, `app/cart/page.tsx` |
| 5 | Admin consultation management | `lib/consultations.ts`, `app/api/consultations/[id]/route.ts`, `app/admin/page.tsx` |
| 6 | Dedicated consultation chat | `lib/consultations.ts`, `lib/types.ts`, `app/api/consultations/[id]/messages/route.ts`, `app/admin/page.tsx`, `app/dashboard/page.tsx` |
| 7 | Mobile shop cards + toast | `app/shop/page.tsx` |
| 8 | Mobile product detail | `app/shop/[id]/page.tsx` |
| 9 | Mobile cart | `app/cart/page.tsx` |
| 10 | General mobile audit | Various pages |
