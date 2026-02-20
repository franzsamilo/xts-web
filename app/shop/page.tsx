"use client";

import React, { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShopIcon } from '@/components/icons';
import { Box, Search, Activity, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

const categories = ['All', 'Robotics', 'Motion', 'Power', 'Hardware', 'Sensors', 'Electronics'];

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const { addToCart } = useCart();

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (e) {
        console.error("Failed to sync store inventory", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      category: product.category,
      sku: product.sku,
      tag: product.tag,
    });
    // Show brief "added" feedback
    setAddedIds(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  return (
    <PageShell>
      <div className="container mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <SectionHeading
            title="Hardware Shop"
            annotation="Quality Parts for Every Build"
            dark={true}
            className="mb-0"
          />

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-safety-orange transition-colors" />
              <Input
                placeholder="Search inventory..."
                className="pl-12 w-full md:w-64 bg-zinc-900 border-zinc-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-tighter transition-all border ${
                selectedCategory === cat
                ? 'bg-safety-orange border-safety-orange text-white'
                : 'bg-zinc-900 border-white/10 text-zinc-500 hover:border-zinc-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((p) => (
              <Card key={p.id} annotation={p.tag} className="flex flex-col h-full hover:rotate-0 transition-transform">
                <Link href={`/shop/${p.id}`} className="group block">
                  <div className="aspect-square bg-zinc-200 mb-6 rounded-sm flex items-center justify-center relative overflow-hidden">
                    <Box className="w-24 h-24 text-zinc-400 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-2 right-2">
                      <Badge variant={p.stock < 10 ? 'warning' : 'new'}>
                        {p.stock < 10 ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-grow min-h-[120px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{p.category}</span>
                    </div>
                    <h3 className="text-xl font-bold text-esd-dark mb-4 group-hover:text-safety-orange transition-colors line-clamp-2">{p.name}</h3>
                    <p className="text-zinc-500 text-xs mb-6 font-medium line-clamp-3">{p.description}</p>
                  </div>
                </Link>

                <div className="flex items-center justify-between pt-6 border-t border-black/5 mt-auto">
                  <span className="text-2xl font-black text-safety-orange">PHP {parseFloat(p.price).toFixed(2)}</span>
                  <Button
                    variant="primary"
                    size="sm"
                    className={`px-4 min-w-0 transition-all ${addedIds.has(p.id) ? 'bg-green-600 hover:bg-green-600' : ''}`}
                    onClick={() => handleAddToCart(p)}
                  >
                    {addedIds.has(p.id) ? (
                      <><Check className="w-4 h-4 mr-1" /> Added</>
                    ) : (
                      <><ShopIcon className="w-5 h-5 mr-2" /> Add</>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center text-center bg-black/10 border-2 border-dashed border-white/5 rounded-sm">
            <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center mb-6 rotate-45">
              <Box className="w-8 h-8 text-zinc-700 -rotate-45" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase mb-2 tracking-tighter">Inventory Offline</h3>
            <p className="text-zinc-500 max-w-sm font-medium uppercase text-xs tracking-widest">No hardware components are currently listed for acquisition.</p>
            <Button className="mt-8" variant="outline" onClick={() => window.location.reload()}>Refresh System</Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
