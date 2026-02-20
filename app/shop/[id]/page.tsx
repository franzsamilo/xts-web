"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShopIcon } from '@/components/icons';
import { Box, ArrowLeft, ShieldCheck, Truck, RotateCcw, Activity, Check } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const products = await res.json();
          const found = products.find((p: any) => p.id === id);
          setProduct(found);
        }
      } catch (e) {
        console.error("Failed to fetch node data", e);
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
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <PageShell>
        <div className="container mx-auto px-6 py-32 flex justify-center">
          <Activity className="w-12 h-12 text-safety-orange animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell>
        <div className="container mx-auto px-6 py-32 text-center">
          <h2 className="text-4xl font-black text-white uppercase mb-4">Node Not Found</h2>
          <Button onClick={() => router.push('/shop')}>Back to Registry</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container mx-auto px-6 py-20">
        <Link href="/shop" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-12 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Inventory</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Section */}
          <div className="space-y-6">
            <div className="aspect-square bg-zinc-900 border border-white/5 rounded-sm flex items-center justify-center relative overflow-hidden">
               <Box className="w-48 h-48 text-zinc-800" />
               <div className="absolute top-6 left-6">
                 <Badge variant="new" className="bg-safety-orange text-white border-none">{product.tag}</Badge>
               </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-zinc-900 border border-white/5 rounded-sm flex items-center justify-center opacity-40 hover:opacity-100 cursor-pointer transition-all">
                  <Box className="w-8 h-8 text-zinc-700" />
                </div>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="mb-8">
              <span className="text-xs font-black text-safety-orange uppercase tracking-widest block mb-4">{product.category} // SERIAL: {product.sku}</span>
              <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black text-white">PHP {parseFloat(product.price).toFixed(2)}</span>
                <Badge variant={product.stock > 0 ? 'completed' : 'pending'}>
                  {product.stock > 0 ? `${product.stock} UNITS AVAILABLE` : 'OUT OF STOCK'}
                </Badge>
              </div>
            </div>

            <p className="text-lg text-zinc-400 font-medium leading-relaxed mb-10 border-l-2 border-safety-orange/30 pl-6 py-2">
              {product.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-sm">
                <ShieldCheck className="w-5 h-5 text-safety-orange mb-3" />
                <h4 className="text-[10px] font-black text-white uppercase">1Y Warranty</h4>
              </div>
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-sm">
                <Truck className="w-5 h-5 text-safety-orange mb-3" />
                <h4 className="text-[10px] font-black text-white uppercase">Global Ship</h4>
              </div>
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-sm">
                <RotateCcw className="w-5 h-5 text-safety-orange mb-3" />
                <h4 className="text-[10px] font-black text-white uppercase">30D Returns</h4>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <Button
                className={`w-full h-16 text-lg uppercase font-black tracking-widest transition-all ${
                  added
                    ? 'bg-green-600 hover:bg-green-600 shadow-[0_6px_0_0_#166534]'
                    : 'bg-safety-orange hover:bg-safety-orange/80 shadow-[0_6px_0_0_#c2410c]'
                } active:translate-y-[2px] active:shadow-none`}
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                {added ? (
                  <><Check className="w-6 h-6 mr-3" /> Added to Queue</>
                ) : (
                  <><ShopIcon className="w-6 h-6 mr-3" /> Add to Acquisition Queue</>
                )}
              </Button>
              <p className="text-[10px] text-center text-zinc-600 font-bold uppercase tracking-widest">
                Technical review and NDA coverage optional at checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
