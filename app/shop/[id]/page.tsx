"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShopIcon } from '@/components/icons';
import { Box, ArrowLeft, ShieldCheck, Truck, RotateCcw, Activity, Check, ShoppingCart, MessageCircle, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useSession } from 'next-auth/react';
import { ADMIN_INBOX_EMAIL } from '@/lib/admin-email';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        }
      } catch (e) {
        console.error("Failed to fetch product", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      category: product.category,
      sku: product.sku,
      tag: product.tag,
      imageUrl: product.imageUrls?.[0] || '',
      sellerId: product.sellerId || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  const handleChatSeller = async () => {
    if (!session?.user?.email) {
      router.push('/login');
      return;
    }
    setChatLoading(true);
    setChatError(null);
    try {
      const productPrice = parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 });
      const initialMessage = `Hi! I'm interested in this product:\n\n📦 ${product.name}\n🏷️ SKU: ${product.sku}\n💰 Price: ₱${productPrice}\n📂 Category: ${product.category}\n\nCould you help me with more details?`;

      // Route to the product's seller if available, otherwise fall back to admin inbox
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
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setChatError(payload.error || `Could not start chat (HTTP ${res.status})`);
        return;
      }
      if (payload.id) {
        router.push(`/chat?id=${payload.id}`);
      } else {
        setChatError('Chat created but response was malformed. Check your inbox.');
      }
    } catch (e) {
      console.error('Failed to start chat', e);
      setChatError('Network error while starting chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 sm:px-6 py-32 flex justify-center">
          <Activity className="w-10 h-10 text-safety-orange animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 sm:px-6 py-32 text-center">
          <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase mb-4">Product Not Found</h2>
          <Button onClick={() => router.push('/shop')}>Back to Shop</Button>
        </div>
      </PageShell>
    );
  }

  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [];
  const specs = product.specifications || [];

  return (
    <PageShell>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 pb-24 sm:pb-20">
        <Link href="/shop" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-8 sm:mb-10 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Shop</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm flex items-center justify-center relative overflow-hidden">
              {images.length > 0 ? (
                <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Box className="w-32 h-32 sm:w-40 sm:h-40 text-[var(--text-muted)] opacity-30" />
              )}
              <div className="absolute top-4 left-4">
                <Badge variant="new" className="bg-safety-orange text-white border-none">{product.tag}</Badge>
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-safety-orange' : 'border-[var(--border-primary)] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {images.length === 0 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm flex items-center justify-center opacity-40">
                    <Box className="w-6 h-6 text-[var(--text-muted)]" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="mb-4 sm:mb-6">
              <span className="text-[10px] font-black text-safety-orange uppercase tracking-widest block mb-2">{product.category} // {product.sku}</span>
              <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none mb-3 sm:mb-4">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">PHP {parseFloat(product.price).toFixed(2)}</span>
                <Badge variant={product.stock > 0 ? 'completed' : 'warning'} className="text-[10px]">
                  {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                </Badge>
              </div>
              {/* Rating & Sold */}
              <div className="flex items-center gap-4 mt-3">
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-bold text-[var(--text-primary)]">{product.rating}</span>
                  </div>
                )}
                {product.totalSold != null && (
                  <span className="text-xs text-[var(--text-muted)] font-medium">{product.totalSold} sold</span>
                )}
              </div>
            </div>

            <p className="text-sm sm:text-base text-[var(--text-secondary)] font-medium leading-relaxed mb-6 sm:mb-8 border-l-2 border-safety-orange/30 pl-4 py-1">
              {product.description}
            </p>

            {/* Specs */}
            {specs.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-3">Specifications</h3>
                <div className="border border-[var(--border-primary)] rounded-sm overflow-hidden">
                  {specs.map((spec: { key: string; value: string }, i: number) => (
                    <div key={i} className={`flex text-sm ${i % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-secondary)]'}`}>
                      <span className="w-1/3 sm:w-2/5 px-3 py-2 font-bold text-[var(--text-secondary)] text-xs uppercase border-r border-[var(--border-secondary)]">{spec.key}</span>
                      <span className="flex-grow px-3 py-2 text-[var(--text-primary)] text-xs">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
              <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm text-center">
                <ShieldCheck className="w-4 h-4 text-safety-orange mx-auto mb-1.5" />
                <h4 className="text-[9px] font-black text-[var(--text-primary)] uppercase">1Y Warranty</h4>
              </div>
              <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm text-center">
                <Truck className="w-4 h-4 text-safety-orange mx-auto mb-1.5" />
                <h4 className="text-[9px] font-black text-[var(--text-primary)] uppercase">Fast Ship</h4>
              </div>
              <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm text-center">
                <RotateCcw className="w-4 h-4 text-safety-orange mx-auto mb-1.5" />
                <h4 className="text-[9px] font-black text-[var(--text-primary)] uppercase">30D Returns</h4>
              </div>
            </div>

            {/* Action Buttons (hidden on mobile — sticky bottom bar replaces these) */}
            <div className="mt-auto space-y-3 hidden sm:block">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className={`h-12 sm:h-14 text-sm uppercase font-black tracking-wider transition-all w-full ${
                    added
                      ? 'bg-green-600 hover:bg-green-600 shadow-[0_4px_0_0_#166534]'
                      : 'bg-safety-orange hover:bg-safety-orange/80 shadow-[0_4px_0_0_#c2410c]'
                  } active:translate-y-[2px] active:shadow-none`}
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  {added ? (
                    <><Check className="w-4 h-4 mr-2" /> Added</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart</>
                  )}
                </Button>
                <Button
                  className="h-12 sm:h-14 text-sm uppercase font-black tracking-wider bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] active:translate-y-[2px] active:shadow-none w-full"
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                >
                  <Zap className="w-4 h-4 mr-2" /> Buy Now
                </Button>
              </div>
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
            </div>
            {chatError && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-sm">
                <p className="text-xs text-red-500 font-bold">{chatError}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      {product && (
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
      )}
    </PageShell>
  );
}
