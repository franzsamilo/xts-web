"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart, PENDING_GCASH_ORDER_KEY } from '@/lib/cart-context';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, X, ShoppingCart, Package, ArrowRight, Trash2, CheckCircle2, Activity, Truck, MapPin, CreditCard, Banknote, MessageCircle } from 'lucide-react';
import { BASE_CURRENCY, PAYMONGO_MIN_AMOUNT_PHP } from '@/lib/currency';

interface PickupPoint {
  id: string;
  name: string;
  address: string;
}

/** Courier delivery (e.g. J&T): UI kept for later; disabled until integration. */
const STANDARD_DELIVERY_ENABLED = false;

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);

  // Delivery state — default to pickup while standard delivery is disabled
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'pickup' | null>(
    STANDARD_DELIVERY_ENABLED ? null : 'pickup'
  );
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<PickupPoint | null>(null);
  const [loadingPickupPoints, setLoadingPickupPoints] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'gcash' | null>(null);

  // Fetch pickup points when pickup is selected
  useEffect(() => {
    if (deliveryMethod === 'pickup' && pickupPoints.length === 0) {
      setLoadingPickupPoints(true);
      fetch('/api/pickup-points')
        .then(res => res.json())
        .then(data => setPickupPoints(data))
        .catch(() => {})
        .finally(() => setLoadingPickupPoints(false));
    }
  }, [deliveryMethod, pickupPoints.length]);

  const belowMinForGcash =
    paymentMethod === 'gcash' &&
    BASE_CURRENCY.toUpperCase() === 'PHP' &&
    cartTotal < PAYMONGO_MIN_AMOUNT_PHP;

  const canCheckout =
    session &&
    deliveryMethod &&
    paymentMethod &&
    !belowMinForGcash &&
    (deliveryMethod === 'standard' || (deliveryMethod === 'pickup' && selectedPickup));

  const handlePickupChat = async () => {
    if (!session || !selectedPickup) return;
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: 'admin@xts.com',
          recipientName: 'XTS Admin',
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
    }
  };

  const handleCheckout = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (!deliveryMethod || !paymentMethod) return;
    if (!STANDARD_DELIVERY_ENABLED && deliveryMethod === 'standard') return;
    if (deliveryMethod === 'pickup' && !selectedPickup) return;

    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            name: item.name,
            sku: item.sku || '',
            category: item.category || 'Hardware',
            price: item.price,
            quantity: item.quantity,
          })),
          total: cartTotal,
          deliveryMethod,
          pickupPointId: selectedPickup?.id || undefined,
          pickupPointName: selectedPickup?.name || undefined,
          paymentMethod,
        }),
      });

      const orderPayload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheckoutError(orderPayload.error || 'Could not create order');
        return;
      }

      const order = orderPayload as { id: string };

      if (paymentMethod === 'gcash') {
        const linkRes = await fetch('/api/payments/create-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        });
        const linkData = await linkRes.json().catch(() => ({}));
        if (!linkRes.ok || !linkData.checkoutUrl) {
          setCheckoutError(
            linkData.error ||
              'Could not start GCash payment. Your order was saved — open Dashboard → Order History and use “Complete GCash payment”, or contact support.'
          );
          return;
        }
        // Mark this order as the in-flight GCash payment. Cart stays intact in
        // case the redirect fails — it will be cleared by CartProvider once the
        // webhook confirms the order as paid (or failed).
        try { localStorage.setItem(PENDING_GCASH_ORDER_KEY, order.id); } catch {}
        window.location.assign(linkData.checkoutUrl as string);
        return;
      }

      setOrderPlaced(order.id);
      clearCart();
    } catch (e) {
      console.error('Checkout failed', e);
      setCheckoutError('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (orderPlaced) {
    return (
      <PageShell>
        <div className="container mx-auto px-6 py-20 min-h-[60vh] flex flex-col items-center justify-center text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-8" />
          </motion.div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Order Confirmed</h2>
          <p className="text-zinc-500 max-w-md font-medium uppercase text-xs tracking-widest leading-loose mb-4">
            Your procurement request has been transmitted. An engineering team member will process your order within 24 hours.
          </p>
          <p className="text-safety-orange font-mono text-sm mb-10">
            Order Reference: {orderPlaced.slice(0, 8).toUpperCase()}
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="outline">View Dashboard</Button>
            </Link>
            <Link href="/shop">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell>
        <div className="container mx-auto px-6 py-20 min-h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center mb-8 rotate-45">
            <ShoppingCart className="w-10 h-10 text-zinc-700 -rotate-45" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Acquisition Queue Empty</h2>
          <p className="text-zinc-500 max-w-md font-medium uppercase text-xs tracking-widest leading-loose mb-10">
            No hardware components have been added to your procurement queue yet.
          </p>
          <Link href="/shop">
            <Button className="px-10 h-14 text-sm uppercase font-black tracking-widest">
              Browse Inventory <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <SectionHeading
            title="Acquisition Queue"
            annotation={`${cartCount} Item${cartCount !== 1 ? 's' : ''} Staged`}
            dark={true}
            className="mb-0"
          />
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 border-red-500/30 hover:bg-red-500/10 flex items-center gap-2"
            onClick={clearCart}
          >
            <Trash2 className="w-4 h-4" /> Clear Queue
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }} transition={{ duration: 0.2 }}>
                  <Card className="relative group">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <Link href={`/shop/${item.id}`} className="shrink-0">
                        <div className="w-24 h-24 rounded-sm overflow-hidden bg-zinc-200 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-10 h-10 text-zinc-400" />
                          )}
                        </div>
                      </Link>
                      <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                            {item.category || 'Hardware'} {item.sku ? `// ${item.sku}` : ''}
                          </span>
                          <Link href={`/shop/${item.id}`}>
                            <h4 className="text-lg font-black text-esd-dark uppercase tracking-tight mb-1 hover:text-safety-orange transition-colors">{item.name}</h4>
                          </Link>
                          <span className="text-sm font-black text-safety-orange">PHP {item.price.toFixed(2)}</span>
                        </div>
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
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* ─── Delivery Method Selector ─── */}
            <div className="mt-10">
              <h3
                className={`text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3 ${
                  STANDARD_DELIVERY_ENABLED ? 'mb-6' : 'mb-2'
                }`}
              >
                <Truck className="w-5 h-5 text-safety-orange" />
                Select Delivery Method
              </h3>
              {!STANDARD_DELIVERY_ENABLED && (
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">
                  Courier delivery paused — pickup only for now
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard Delivery — disabled for now; re-enable via STANDARD_DELIVERY_ENABLED */}
                <button
                  type="button"
                  id="delivery-standard"
                  disabled={!STANDARD_DELIVERY_ENABLED}
                  onClick={() => {
                    if (!STANDARD_DELIVERY_ENABLED) return;
                    setDeliveryMethod('standard');
                    setSelectedPickup(null);
                  }}
                  className={`relative text-left p-6 rounded-sm border-2 transition-all duration-200 group ${
                    STANDARD_DELIVERY_ENABLED
                      ? deliveryMethod === 'standard'
                        ? 'border-safety-orange bg-safety-orange/5 shadow-lg shadow-safety-orange/10'
                        : 'border-white/10 bg-zinc-900 hover:border-white/20'
                      : 'border-white/10 bg-zinc-950/80 opacity-70 cursor-not-allowed border-dashed'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                        STANDARD_DELIVERY_ENABLED && deliveryMethod === 'standard'
                          ? 'bg-safety-orange text-white'
                          : 'bg-zinc-800 text-zinc-600'
                      }`}
                    >
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={`text-sm font-black text-white uppercase tracking-tight mb-1 ${
                          !STANDARD_DELIVERY_ENABLED ? 'line-through decoration-zinc-500 decoration-2' : ''
                        }`}
                      >
                        Standard Delivery
                      </h4>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${
                          !STANDARD_DELIVERY_ENABLED
                            ? 'text-zinc-600 line-through decoration-zinc-600'
                            : 'text-zinc-500'
                        }`}
                      >
                        Delivered via courier partner (J&T Express)
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-800/80 px-2 py-1 rounded-sm border border-white/10">
                          Pickup only for now
                        </span>
                        {STANDARD_DELIVERY_ENABLED && (
                          <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-1 rounded-sm border border-yellow-500/20">
                            Integration Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {STANDARD_DELIVERY_ENABLED && deliveryMethod === 'standard' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-safety-orange" />
                    </motion.div>
                  )}
                </button>

                {/* Pickup Point */}
                <button
                  id="delivery-pickup"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`relative text-left p-6 rounded-sm border-2 transition-all duration-200 group ${
                    deliveryMethod === 'pickup'
                      ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                      : 'border-white/10 bg-zinc-900 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                      deliveryMethod === 'pickup' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500 group-hover:text-white'
                    }`}>
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Local Pickup</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                        Pick up from a designated meetup point
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded-sm border border-green-500/20">
                          Available Now
                        </span>
                      </div>
                    </div>
                  </div>
                  {deliveryMethod === 'pickup' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    </motion.div>
                  )}
                </button>
              </div>

              {/* Pickup Point Selection */}
              <AnimatePresence>
                {deliveryMethod === 'pickup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-6 bg-zinc-900 border border-blue-500/20 rounded-sm">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        Choose Pickup Location
                      </h4>

                      {loadingPickupPoints ? (
                        <div className="py-8 flex justify-center">
                          <Activity className="w-6 h-6 text-blue-500 animate-spin" />
                        </div>
                      ) : pickupPoints.length > 0 ? (
                        <div className="space-y-3">
                          {pickupPoints.map(point => (
                            <button
                              key={point.id}
                              onClick={() => setSelectedPickup(point)}
                              className={`w-full text-left px-4 py-3 rounded-sm border transition-all ${
                                selectedPickup?.id === point.id
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : 'border-white/5 bg-zinc-800/50 hover:border-white/15'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  selectedPickup?.id === point.id ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-400'
                                }`}>
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-white block">{point.name}</span>
                                  <span className="text-[10px] text-zinc-500 font-medium">{point.address}</span>
                                </div>
                                {selectedPickup?.id === point.id && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-500 ml-auto shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <MapPin className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">No pickup points available</p>
                          <p className="text-[10px] text-zinc-600 mt-1">Contact the admin to add pickup locations.</p>
                        </div>
                      )}

                      {/* Chat about Pickup Button */}
                      {selectedPickup && session && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 pt-4 border-t border-white/5"
                        >
                          <button
                            onClick={handlePickupChat}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-sm text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Chat about Pickup</span>
                          </button>
                          <p className="text-[9px] text-zinc-600 text-center mt-2">Coordinate pickup time and details with the seller</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── Payment Method Selector ─── */}
            <div className="mt-10">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-safety-orange" />
                Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash on Delivery */}
                <button
                  id="payment-cod"
                  onClick={() => setPaymentMethod('cod')}
                  className={`relative text-left p-6 rounded-sm border-2 transition-all duration-200 group ${
                    paymentMethod === 'cod'
                      ? 'border-green-500 bg-green-500/5 shadow-lg shadow-green-500/10'
                      : 'border-white/10 bg-zinc-900 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                      paymentMethod === 'cod' ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500 group-hover:text-white'
                    }`}>
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Cash on Delivery</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                        Pay when you receive your order
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded-sm border border-green-500/20">
                          Available
                        </span>
                      </div>
                    </div>
                  </div>
                  {paymentMethod === 'cod' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                </button>

                {/* Paymongo GCash */}
                <button
                  id="payment-gcash"
                  onClick={() => setPaymentMethod('gcash')}
                  className={`relative text-left p-6 rounded-sm border-2 transition-all duration-200 group ${
                    paymentMethod === 'gcash'
                      ? 'border-blue-400 bg-blue-400/5 shadow-lg shadow-blue-400/10'
                      : 'border-white/10 bg-zinc-900 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                      paymentMethod === 'gcash' ? 'bg-blue-400 text-white' : 'bg-zinc-800 text-zinc-500 group-hover:text-white'
                    }`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">GCash</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                        Pay via Paymongo GCash
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9px] font-black text-blue-400/90 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-sm border border-blue-500/25">
                          Available
                        </span>
                      </div>
                    </div>
                  </div>
                  {paymentMethod === 'gcash' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    </motion.div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ─── Order Summary Sidebar ─── */}
          <div className="space-y-6">
            <div className="sticky top-32">
              <div className="p-8 bg-zinc-900 border border-white/5 rounded-sm shadow-2xl">
                <h4 className="text-lg font-black text-white uppercase mb-8 tracking-tighter">Order Summary</h4>
                <div className="space-y-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-bold uppercase">Subtotal ({cartCount} items)</span>
                    <span className="text-white font-black">PHP {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-bold uppercase">Shipping</span>
                    <span className="text-zinc-400 font-medium italic">
                      {deliveryMethod === 'pickup' ? 'Free (Pickup)' : STANDARD_DELIVERY_ENABLED && deliveryMethod === 'standard' ? 'TBD' : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-bold uppercase">Tax</span>
                    <span className="text-zinc-400 font-medium italic">Included</span>
                  </div>
                </div>

                {/* Delivery method summary */}
                {deliveryMethod && (
                  <div className="mb-4 p-3 rounded-sm border border-white/5 bg-zinc-800/50">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Delivery</span>
                    {STANDARD_DELIVERY_ENABLED && deliveryMethod === 'standard' ? (
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-safety-orange" />
                        <span className="text-xs font-bold text-white">Standard Delivery (J&T)</span>
                      </div>
                    ) : selectedPickup ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-bold text-white">{selectedPickup.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-yellow-500 font-bold">Select a pickup point</span>
                    )}
                  </div>
                )}

                {/* Payment method summary */}
                {paymentMethod && (
                  <div className="mb-6 p-3 rounded-sm border border-white/5 bg-zinc-800/50">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Payment</span>
                    <div className="flex items-center gap-2">
                      {paymentMethod === 'cod' ? (
                        <>
                          <Banknote className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs font-bold text-white">Cash on Delivery</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-bold text-white">GCash (Paymongo)</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-white/10 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total</span>
                    <span className="text-3xl font-black text-safety-orange">PHP {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {!session && (
                  <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-sm">
                    <p className="text-xs text-red-400 font-bold">Sign in to place your order.</p>
                  </div>
                )}

                {session && !deliveryMethod && (
                  <div className="mb-4 p-3 bg-yellow-950/30 border border-yellow-500/20 rounded-sm">
                    <p className="text-xs text-yellow-400 font-bold">Please select a delivery method below.</p>
                  </div>
                )}

                {session && deliveryMethod && !paymentMethod && (
                  <div className="mb-4 p-3 bg-yellow-950/30 border border-yellow-500/20 rounded-sm">
                    <p className="text-xs text-yellow-400 font-bold">Please select a payment method below.</p>
                  </div>
                )}

                {session && paymentMethod === 'gcash' && belowMinForGcash && (
                  <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-sm">
                    <p className="text-xs text-red-400 font-bold">
                      Minimum GCash (PayMongo) payment is PHP {PAYMONGO_MIN_AMOUNT_PHP.toFixed(2)}. Add items or choose COD.
                    </p>
                  </div>
                )}

                {checkoutError && (
                  <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-sm">
                    <p className="text-xs text-red-400 font-bold">{checkoutError}</p>
                  </div>
                )}

                <Button
                  id="place-order-btn"
                  className="w-full h-14 text-sm uppercase font-black tracking-widest bg-safety-orange hover:bg-safety-orange/80 shadow-[0_6px_0_0_#995400] active:translate-y-[2px] active:shadow-[0_4px_0_0_#995400] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleCheckout}
                  disabled={checkingOut || !canCheckout}
                >
                  {checkingOut ? (
                    <span className="flex items-center gap-2"><Activity className="w-5 h-5 animate-spin" /> Processing...</span>
                  ) : 'Place Order'}
                </Button>

                <p className="text-[10px] text-center text-zinc-600 font-bold uppercase tracking-widest mt-4">
                  Secure processing via XTS-PAY
                </p>
              </div>

              <div className="mt-6 p-1 bg-yellow-500/20 rounded-sm">
                <div className="p-4 bg-zinc-900 border border-yellow-500/30 rounded-sm">
                  <p className="font-handwriting text-yellow-500 italic text-sm text-center">
                    &quot;All acquisitions include standard warranty and technical documentation.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
