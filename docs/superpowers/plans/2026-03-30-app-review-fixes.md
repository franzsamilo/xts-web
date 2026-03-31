# XTS-Web App Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical, important, and minor issues found during the comprehensive app review — security gaps, UI/mobile responsiveness bugs, animation conflicts, and missing functionality.

**Architecture:** Backend security fixes use server-side session checks and Firestore atomic operations. Frontend fixes use responsive Tailwind classes, Framer Motion adjustments, and Next.js `<Image>` migration. Chat polling uses `setInterval` on the client.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Firebase Admin SDK, NextAuth, PayMongo

---

## File Map

### Backend Security & Data Integrity
- Modify: `app/api/upload/route.ts` — add auth + file validation
- Modify: `app/api/chats/[id]/route.ts` — add auth to GET, ownership to DELETE
- Modify: `app/api/orders/route.ts` — server-side price validation
- Modify: `app/api/consultations/route.ts` — role-based filtering on GET
- Modify: `app/api/consultations/[id]/route.ts` — admin-only PATCH
- Modify: `app/api/posts/route.ts` — store userId/userEmail on posts
- Modify: `app/api/posts/[id]/comments/route.ts` — atomic comment count
- Modify: `app/api/payments/webhook/route.ts` — return 400 on amount mismatch
- Modify: `lib/posts.ts` — atomic like with FieldValue
- Modify: `lib/orders.ts` — Firestore transaction for markOrderPaidFromPaymongo
- Modify: `lib/products.ts` — add getProductById for validation, add orderBy
- Modify: `lib/consultations.ts` — add getConsultationsByUser function
- Modify: `middleware.ts` — add /seller and /chat to matcher

### Frontend UI/UX Fixes
- Modify: `app/cart/page.tsx` — fix mobile overflow on cart item row
- Modify: `app/dashboard/page.tsx` — remove duplicate delivery method display
- Modify: `app/chat/page.tsx` — add message polling
- Modify: `app/services/page.tsx` — fix double file dialog trigger
- Modify: `app/page.tsx` — newsletter toast feedback
- Modify: `app/seller/page.tsx` — reset file input after selection
- Modify: `app/community/page.tsx` — fix hardcoded light colors in comment bubbles
- Modify: `components/ui/Button.tsx` — remove conflicting Framer Motion tap/hover
- Modify: `components/ui/ConfirmModal.tsx` — add focus trap, Escape key
- Modify: `components/layout/Footer.tsx` — point dead links to existing pages

---

### Task 1: Secure the Upload Endpoint

**Files:**
- Modify: `app/api/upload/route.ts`

- [ ] **Step 1: Add auth check and file validation**

Replace the entire file content with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'model/stl', 'application/sla',
  'application/dxf', 'image/vnd.dxf',
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileId = crypto.randomUUID();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `uploads/${fileId}.${ext}`;

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    await fileRef.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx next build --no-lint 2>&1 | head -30`
Expected: No errors in upload/route.ts

---

### Task 2: Secure Chat Endpoints

**Files:**
- Modify: `app/api/chats/[id]/route.ts`

- [ ] **Step 1: Add auth to GET and ownership check to DELETE**

Replace the entire file content with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getMessages, addMessage, getChatById, deleteChat, markChatAsRead } from '@/lib/chat';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is a participant
    const chat = await getChatById(id);
    if (!chat || !chat.participants.includes(session.user.email)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const messages = await getMessages(id);

    markChatAsRead(id, session.user.email).catch(() => {});

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

    // Verify user is a participant
    const chat = await getChatById(id);
    if (!chat || !chat.participants.includes(session.user.email)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();

    const message = await addMessage(id, {
      senderId: session.user.email,
      senderName: session.user.name || 'User',
      senderAvatar: session.user.image || '',
      content: body.content,
      createdAt: new Date(),
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const role = (session.user as any)?.role || '';

    // Only participants or admins can delete
    const chat = await getChatById(id);
    if (!chat) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (!chat.participants.includes(session.user.email) && !role.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteChat(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
```

---

### Task 3: Server-Side Price Validation on Order Creation

**Files:**
- Modify: `app/api/orders/route.ts`
- Modify: `lib/products.ts`

- [ ] **Step 1: Add orderBy to getAllProducts**

In `lib/products.ts`, change the `getAllProducts` function's query from:
```typescript
const snapshot = await adminDb.collection('products').get();
```
to:
```typescript
const snapshot = await adminDb.collection('products').orderBy('createdAt', 'desc').get();
```

- [ ] **Step 2: Add server-side price/stock validation to orders POST**

Replace `app/api/orders/route.ts` with:

```typescript
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
```

---

### Task 4: Secure Consultations Endpoints

**Files:**
- Modify: `lib/consultations.ts`
- Modify: `app/api/consultations/route.ts`
- Modify: `app/api/consultations/[id]/route.ts`

- [ ] **Step 1: Add getConsultationsByUser to lib/consultations.ts**

Add this function after `getAllConsultations`:

```typescript
export async function getConsultationsByUser(email: string): Promise<ConsultationData[]> {
  try {
    const snapshot = await adminDb
      .collection('consultations')
      .where('clientEmail', '==', email)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    })) as ConsultationData[];
  } catch (error) {
    console.error('Error fetching user consultations:', error);
    return [];
  }
}
```

- [ ] **Step 2: Add role-based filtering to consultations GET**

Replace `app/api/consultations/route.ts` with:

```typescript
import { NextResponse } from 'next/server';
import { getAllConsultations, getConsultationsByUser, createConsultation } from '@/lib/consultations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const role = (session.user as any)?.role || '';
    if (role.includes('admin') || role.includes('expert')) {
      const consultations = await getAllConsultations();
      return NextResponse.json(consultations);
    } else {
      const consultations = await getConsultationsByUser(session.user?.email || '');
      return NextResponse.json(consultations);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const consultation = await createConsultation({
      expertName: body.expertName,
      expertTitle: body.expertTitle,
      expertPrice: body.expertPrice,
      clientName: session.user?.name || 'Unknown',
      clientEmail: session.user?.email || '',
      slot: body.slot,
      status: 'pending',
      createdAt: new Date(),
    });
    return NextResponse.json(consultation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create consultation' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add admin-only check and status validation to PATCH**

Replace `app/api/consultations/[id]/route.ts` with:

```typescript
import { NextResponse } from 'next/server';
import { updateConsultationStatus } from '@/lib/consultations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { status } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await updateConsultationStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update consultation' }, { status: 500 });
  }
}
```

---

### Task 5: Atomic Comment Count & Like Operations

**Files:**
- Modify: `app/api/posts/[id]/comments/route.ts:52-57`
- Modify: `app/api/posts/route.ts:25-39`
- Modify: `lib/posts.ts:49-74`

- [ ] **Step 1: Use FieldValue.increment for comment count**

In `app/api/posts/[id]/comments/route.ts`, replace lines 52-57:

```typescript
    // Increment the post's comment count
    const postRef = adminDb.collection('posts').doc(id);
    const postDoc = await postRef.get();
    if (postDoc.exists) {
      await postRef.update({ comments: (postDoc.data()?.comments || 0) + 1 });
    }
```

with:

```typescript
    // Atomically increment the post's comment count
    const { FieldValue } = await import('firebase-admin/firestore');
    const postRef = adminDb.collection('posts').doc(id);
    await postRef.update({ comments: FieldValue.increment(1) });
```

- [ ] **Step 2: Use FieldValue.arrayUnion and increment for likes**

In `lib/posts.ts`, replace the `likePost` function (lines 49-74) with:

```typescript
export async function likePost(postId: string, userId: string): Promise<{ likes: number; alreadyLiked: boolean }> {
  const { FieldValue } = await import('firebase-admin/firestore');
  const docRef = adminDb.collection('posts').doc(postId);
  const doc = await docRef.get();

  if (!doc.exists) throw new Error('Post not found');

  const data = doc.data()!;
  const likedBy: string[] = data.likedBy || [];

  if (likedBy.includes(userId)) {
    return { likes: data.likes, alreadyLiked: true };
  }

  await docRef.update({
    likes: FieldValue.increment(1),
    likedBy: FieldValue.arrayUnion(userId),
  });

  return { likes: (data.likes || 0) + 1, alreadyLiked: false };
}
```

- [ ] **Step 3: Store userId/userEmail on post creation**

In `app/api/posts/route.ts`, change the `createPost` call (lines 27-39) — add `userId` and `userEmail` to the data:

```typescript
    const post = await createPost({
      title: body.title,
      content: body.content,
      author: authorName,
      avatar: authorName[0].toUpperCase(),
      tag: body.tag || 'Build Log',
      likes: 0,
      likedBy: [],
      comments: 0,
      isPinned: false,
      imageUrls: body.imageUrls || [],
      userId,
      userEmail: session.user?.email || '',
      createdAt: new Date(),
    });
```

Also update `lib/posts.ts` `PostData` interface to add:
```typescript
  userId?: string;
  userEmail?: string;
```

---

### Task 6: Webhook Amount Mismatch Returns 400

**Files:**
- Modify: `app/api/payments/webhook/route.ts:70-79`

- [ ] **Step 1: Return 400 instead of 200 on amount mismatch**

In `app/api/payments/webhook/route.ts`, replace lines 70-79:

```typescript
    if (typeof amountMinor === 'number' && Number.isFinite(amountMinor)) {
      const expectedMinor = Math.round(Number(order.total) * 100);
      if (expectedMinor !== amountMinor) {
        console.error('[payments/webhook] amount mismatch', {
          orderId,
          expectedMinor,
          amountMinor,
        });
        return NextResponse.json({ ok: false, reason: 'amount_mismatch' });
      }
    }
```

with:

```typescript
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
```

---

### Task 7: Protect /seller and /chat Routes in Middleware

**Files:**
- Modify: `middleware.ts:26-28`

- [ ] **Step 1: Add /seller and /chat to the matcher**

In `middleware.ts`, replace line 27:

```typescript
  matcher: ['/dashboard/:path*', '/admin/:path*', '/apply/:path*'],
```

with:

```typescript
  matcher: ['/dashboard/:path*', '/admin/:path*', '/apply/:path*', '/seller/:path*', '/chat/:path*'],
```

---

### Task 8: Fix Dashboard Duplicate Delivery Display

**Files:**
- Modify: `app/dashboard/page.tsx:211-219`

- [ ] **Step 1: Remove the duplicate delivery method block**

In `app/dashboard/page.tsx`, delete lines 211-219 (the second `order.deliveryMethod` block inside the right-side `<div>`):

```typescript
                            {order.deliveryMethod && (
                              <div className="flex items-center gap-1.5 mt-2">
                                {order.deliveryMethod === 'pickup' ? (
                                  <><MapPin className="w-3 h-3 text-blue-500" /><span className="text-[10px] text-blue-400 font-bold uppercase">Pickup: {order.pickupPointName || 'Local'}</span></>
                                ) : (
                                  <><Truck className="w-3 h-3 text-safety-orange" /><span className="text-[10px] text-zinc-500 font-bold uppercase">Standard Delivery</span></>
                                )}
                              </div>
                            )}
```

Remove this entire block.

---

### Task 9: Fix Cart Item Row Mobile Overflow

**Files:**
- Modify: `app/cart/page.tsx:260-274`

- [ ] **Step 1: Make the quantity/price/delete row wrap on mobile**

In `app/cart/page.tsx`, replace lines 260-274:

```typescript
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-0 border border-black/10 rounded-sm overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-esd-dark transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-12 h-10 flex items-center justify-center text-sm font-black text-esd-dark bg-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-esd-dark transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-lg font-black text-esd-dark w-28 text-right">PHP {(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-2">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
```

with:

```typescript
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                          <div className="flex items-center gap-0 border border-black/10 rounded-sm overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-esd-dark transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-12 h-10 flex items-center justify-center text-sm font-black text-esd-dark bg-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-esd-dark transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-base sm:text-lg font-black text-esd-dark sm:w-28 text-right">PHP {(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-2 ml-auto sm:ml-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
```

---

### Task 10: Fix Button Animation Conflicts

**Files:**
- Modify: `components/ui/Button.tsx:37-39`

- [ ] **Step 1: Remove conflicting Framer Motion whileTap/whileHover**

In `components/ui/Button.tsx`, replace lines 37-39:

```typescript
    <motion.button
      whileTap={{ y: 2, boxShadow: 'none' }}
      whileHover={{ y: -1 }}
```

with:

```typescript
    <motion.button
      whileTap={{ y: 2 }}
      whileHover={{ y: -1 }}
```

This removes the `boxShadow: 'none'` that was overriding Tailwind's custom shadows on tap.

---

### Task 11: Add Focus Trap and Escape Key to ConfirmModal

**Files:**
- Modify: `components/ui/ConfirmModal.tsx`

- [ ] **Step 1: Add Escape key handler and auto-focus**

Replace the entire file with:

```typescript
"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  variant?: 'danger' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = 'Confirm',
  message,
  variant = 'info',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  // Auto-focus the modal when opened
  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-sm shadow-2xl w-full max-w-sm overflow-hidden"
            ref={cancelRef}
            tabIndex={-1}
          >
            {/* Top accent bar */}
            <div className={`h-1 w-full ${isDanger ? 'bg-red-500' : 'bg-safety-orange'}`} />

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-500/10' : 'bg-safety-orange/10'}`}>
                  {isDanger ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Info className="w-5 h-5 text-safety-orange" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-[var(--text-on-card)] uppercase tracking-wide mb-1">{title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{message}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onCancel}>
                  {cancelLabel}
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 text-xs ${isDanger ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_2px_0_0_#991b1b]' : ''}`}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

### Task 12: Add Chat Message Polling

**Files:**
- Modify: `app/chat/page.tsx`

- [ ] **Step 1: Add polling interval when a chat is selected**

In `app/chat/page.tsx`, add a `useEffect` after the existing `useEffect` at line 51-53 (the `fetchChats` one). Add this new effect:

```typescript
  // Poll for new messages every 5 seconds when a chat is open
  useEffect(() => {
    if (!selectedChat) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/${selectedChat.id}`);
        if (res.ok) {
          const msgs = await res.json();
          setMessages(prev => {
            if (msgs.length !== prev.length) {
              setTimeout(() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
              }, 100);
              return msgs;
            }
            return prev;
          });
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedChat]);
```

---

### Task 13: Fix Services Page Double File Dialog

**Files:**
- Modify: `app/services/page.tsx:320-323`

- [ ] **Step 1: Remove the conflicting onClick from the Button**

In `app/services/page.tsx`, replace lines 320-323:

```typescript
                  <label htmlFor="service-file-upload">
                    <Button size="sm" variant="outline" className="text-xs cursor-pointer" onClick={() => document.getElementById('service-file-upload')?.click()}>
                      Choose Files
                    </Button>
                  </label>
```

with:

```typescript
                  <label htmlFor="service-file-upload">
                    <span className="inline-flex items-center justify-center rounded-sm border-2 border-safety-orange text-safety-orange hover:bg-safety-orange/10 px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors">
                      Choose Files
                    </span>
                  </label>
```

This removes the Button (which was adding a conflicting `onClick`) and uses a styled `<span>` inside the `<label>` instead. The label's `htmlFor` handles the file dialog.

---

### Task 14: Fix Seller Page File Input Reset

**Files:**
- Modify: `app/seller/page.tsx:61-71`

- [ ] **Step 1: Reset the file input value after selection**

In `app/seller/page.tsx`, add `e.target.value = '';` at the end of the `handleImageSelect` function, after the `forEach`:

Find:
```typescript
    });
  };
```
at the end of `handleImageSelect` (around line 70-71), and replace with:
```typescript
    });
    e.target.value = '';
  };
```

---

### Task 15: Fix Footer Dead Links

**Files:**
- Modify: `components/layout/Footer.tsx:5-33`

- [ ] **Step 1: Point links to existing pages or anchor sections**

In `components/layout/Footer.tsx`, replace the `footerLinks` array (lines 5-33) with:

```typescript
const footerLinks = [
  {
    title: 'Platform',
    links: [
      { name: 'Shop', href: '/shop' },
      { name: 'Community', href: '/community' },
      { name: 'Consultation', href: '/consultation' },
      { name: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Services',
    links: [
      { name: '3D Printing', href: '/services?type=3d-printing' },
      { name: 'Laser Cutting', href: '/services?type=laser-cutting' },
      { name: 'PCB Fab', href: '/services?type=pcb-fabrication' },
      { name: 'Expert Consultation', href: '/consultation' },
    ],
  },
  {
    title: 'Support',
    links: [
      { name: 'Order Status', href: '/dashboard' },
      { name: 'Messages', href: '/chat' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  },
];
```

---

### Task 16: Newsletter Button Toast Feedback

**Files:**
- Modify: `app/page.tsx:310-324`

- [ ] **Step 1: Add a simple toast/state for the newsletter button**

In `app/page.tsx`, find the newsletter section and replace lines 310-324:

```typescript
      {/* Newsletter */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col items-center">
          <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-8 text-center">Get Engineering Updates</h3>
          <div className="flex w-full max-w-md gap-2">
            <input
              type="email"
              placeholder="engineer@example.com"
              className="grow bg-zinc-800 border-2 border-zinc-700 px-4 py-3 text-white focus:outline-none focus:border-safety-orange transition-colors"
            />
            <Button>Join</Button>
          </div>
          <p className="mt-4 text-zinc-600 text-sm font-handwriting">No spam, just schematics and new part drops.</p>
        </div>
      </section>
```

with:

```typescript
      {/* Newsletter */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col items-center">
          <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-8 text-center">Get Engineering Updates</h3>
          <div className="flex w-full max-w-md gap-2">
            <input
              type="email"
              placeholder="engineer@example.com"
              className="grow bg-zinc-800 border-2 border-zinc-700 px-4 py-3 text-white focus:outline-none focus:border-safety-orange transition-colors"
            />
            <Button onClick={(e) => {
              const input = (e.target as HTMLElement).parentElement?.querySelector('input');
              if (input && input.value.includes('@')) {
                input.value = '';
                alert('Thanks for subscribing!');
              }
            }}>Join</Button>
          </div>
          <p className="mt-4 text-zinc-600 text-sm font-handwriting">No spam, just schematics and new part drops.</p>
        </div>
      </section>
```

---

### Task 17: Fix Community Comment Bubble Colors for Light Theme

**Files:**
- Modify: `app/community/page.tsx:435`

- [ ] **Step 1: Use CSS variable-based colors for comment bubbles**

In `app/community/page.tsx`, find the comment bubble div (around line 435):

```typescript
                                            <div className="flex-grow bg-zinc-50 rounded-sm p-3 border border-black/5">
```

Replace with:

```typescript
                                            <div className="flex-grow bg-[var(--bg-surface)] rounded-sm p-3 border border-[var(--border-secondary)]">
```

Also find the comment text (around line 440):

```typescript
                                              <p className="text-sm text-zinc-700">{c.content}</p>
```

Replace with:

```typescript
                                              <p className="text-sm text-[var(--text-secondary)]">{c.content}</p>
```

---

### Task 18: Verify Build Compiles

- [ ] **Step 1: Run the build**

Run: `npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds with no errors

- [ ] **Step 2: Commit all fixes**

```bash
git add -A
git commit -m "fix: comprehensive app review — security, mobile, UX, and data integrity fixes"
```

---

## Summary

| Category | Tasks | Issues Fixed |
|----------|-------|-------------|
| Security | 1-4, 7 | Upload auth, chat access control, order price validation, consultation access, route protection |
| Data Integrity | 5-6 | Atomic likes/comments, webhook amount mismatch |
| UI/Mobile | 8-9, 13-14 | Dashboard duplicate, cart overflow, double dialog, file reset |
| UX/Functionality | 10-12, 15-17 | Button animation, chat polling, footer links, newsletter, comment colors |
| Accessibility | 11 | Modal focus trap + Escape key |
