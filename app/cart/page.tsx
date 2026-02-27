"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/cart-context';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, X, ShoppingCart, Package, ArrowRight, Trash2, CheckCircle2, Activity } from 'lucide-react';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    setCheckingOut(true);
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
        }),
      });

      if (res.ok) {
        const order = await res.json();
        setOrderPlaced(order.id);
        clearCart();
      }
    } catch (e) {
      console.error('Checkout failed', e);
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
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="sticky top-32">
              <div className="p-8 bg-zinc-900 border border-white/5 rounded-sm shadow-2xl">
                <h4 className="text-lg font-black text-white uppercase mb-8 tracking-tighter">Order Summary</h4>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-bold uppercase">Subtotal ({cartCount} items)</span>
                    <span className="text-white font-black">PHP {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-bold uppercase">Shipping</span>
                    <span className="text-zinc-400 font-medium italic">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-bold uppercase">Tax</span>
                    <span className="text-zinc-400 font-medium italic">Included</span>
                  </div>
                </div>
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

                <Button
                  className="w-full h-14 text-sm uppercase font-black tracking-widest bg-safety-orange hover:bg-safety-orange/80 shadow-[0_6px_0_0_#995400] active:translate-y-[2px] active:shadow-[0_4px_0_0_#995400] transition-all"
                  onClick={handleCheckout}
                  disabled={checkingOut || !session}
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
