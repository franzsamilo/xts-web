"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Box, Search, Star, ShoppingCart, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/cart-context';
import type { ProductDTO } from '@/lib/types';

export default function ShopPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [toastItem, setToastItem] = useState<{ name: string; imageUrl: string } | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!tappedId) return;
    const dismiss = () => setTappedId(null);
    window.addEventListener('scroll', dismiss);
    return () => window.removeEventListener('scroll', dismiss);
  }, [tappedId]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ProductDTO[];
        setProducts(data);
      } catch (e) {
        console.error("Failed to fetch products", e);
        setFetchError("Couldn't load products. Please refresh to try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

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
    setToastItem({ name: product.name, imageUrl: product.imageUrls?.[0] || '' });
    setTimeout(() => setToastItem(null), 2000);
    setTimeout(() => {
      setAddedIds(prev => { const n = new Set(prev); n.delete(product.id); return n; });
    }, 2000);
  };

  return (
    <PageShell>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <SectionHeading title="Shop" annotation="Engineering Hardware" dark={true} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 sm:mb-12">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <Input
              placeholder="Search products or SKU..."
              className="pl-10 bg-[var(--bg-surface)] border-[var(--border-primary)] text-[var(--text-primary)] h-11"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-sm text-[10px] font-black uppercase tracking-tighter transition-all border ${
                  selectedCategory === cat
                    ? 'bg-safety-orange border-safety-orange text-white'
                    : 'bg-[var(--bg-surface)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {fetchError && (
          <div className="mb-8 p-4 bg-red-950/30 border border-red-500/20 rounded-sm">
            <p className="text-sm text-red-400 font-bold">{fetchError}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((product, i) => (
                <motion.div key={product.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="min-w-0">
                  <div
                    className="group relative h-full flex flex-col"
                    onClick={() => {
                      if (window.innerWidth < 640) {
                        setTappedId(prev => prev === product.id ? null : product.id);
                      }
                    }}
                  >
                    <Link
                      href={`/shop/${product.id}`}
                      className="flex-grow min-w-0"
                      onClick={(e) => {
                        if (window.innerWidth < 640 && tappedId !== product.id) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Card hoverEffect={false} className="transition-transform duration-200 sm:group-hover:scale-[1.02] sm:group-hover:-translate-y-1 h-full flex flex-col overflow-hidden">
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
                              transition={{ duration: 0.18 }}
                              className="sm:hidden absolute inset-x-0 bottom-0 rounded-b-sm overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="bg-gradient-to-t from-black/90 to-black/60 px-2 pt-6 pb-2 flex flex-col gap-1.5">
                                <button
                                  onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                                  disabled={product.stock <= 0}
                                  className={`w-full py-2 rounded-sm text-[9px] font-black uppercase tracking-wider transition-all ${
                                    addedIds.has(product.id)
                                      ? 'bg-green-600 text-white'
                                      : product.stock <= 0
                                        ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed'
                                        : 'bg-safety-orange text-white active:scale-95'
                                  }`}
                                >
                                  {addedIds.has(product.id) ? (
                                    <span className="flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Added</span>
                                  ) : product.stock <= 0 ? 'Out of Stock' : (
                                    <span className="flex items-center justify-center gap-1"><ShoppingCart className="w-3 h-3" /> Add to Cart</span>
                                  )}
                                </button>
                                <Link
                                  href={`/shop/${product.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full py-2 rounded-sm text-[9px] font-black uppercase tracking-wider text-center text-white border border-white/30 hover:bg-white/10 transition-all"
                                >
                                  View Details
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </Link>
                    {/* Add to Cart Button — desktop only */}
                    <div className="hidden sm:block mt-1.5 sm:mt-2 shrink-0">
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
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-20 text-center">
            <Box className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-30" />
            <h4 className="text-xl font-black text-[var(--text-primary)] uppercase mb-2">No Products Found</h4>
            <p className="text-sm text-[var(--text-muted)]">Try a different search or category.</p>
          </div>
        )}
      </div>

      {/* Toast notification */}
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
    </PageShell>
  );
}
