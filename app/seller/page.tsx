"use client";

import React, { useState, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Package, ShoppingCart, BarChart3, MessageCircle, Settings, Plus, Edit, Trash2, X, Activity, Upload, Check, Image as ImageIcon, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface SpecField {
  key: string;
  value: string;
}

export default function SellerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Product form state
  const [formData, setFormData] = useState({
    name: '', sku: '', price: '', stock: '', category: 'Components', description: '', tag: 'New',
    rating: '', totalSold: '',
  });
  const [specs, setSpecs] = useState<SpecField[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, ordRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const addSpecField = () => setSpecs(prev => [...prev, { key: '', value: '' }]);
  const removeSpecField = (index: number) => setSpecs(prev => prev.filter((_, i) => i !== index));
  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    setSpecs(prev => prev.map((s, i) => i === index ? { ...s, [field]: val } : s));
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', price: '', stock: '', category: 'Components', description: '', tag: 'New', rating: '', totalSold: '' });
    setSpecs([]);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setEditingProduct(null);
    setShowAddProduct(false);
  };

  const startEdit = (product: any) => {
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      category: product.category || 'Components',
      description: product.description || '',
      tag: product.tag || 'New',
      rating: product.rating?.toString() || '',
      totalSold: product.totalSold?.toString() || '',
    });
    setSpecs(product.specifications || []);
    setExistingImages(product.imageUrls || []);
    setImageFiles([]);
    setImagePreviews([]);
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Upload new images
      const newImageUrls: string[] = [];
      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          newImageUrls.push(data.url);
        }
      }

      const allImages = [...existingImages, ...newImageUrls];
      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        totalSold: formData.totalSold ? parseInt(formData.totalSold) : 0,
        imageUrls: allImages,
        specifications: specs.filter(s => s.key.trim() && s.value.trim()),
      };

      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      }

      resetForm();
      fetchData();
    } catch (e) {
      console.error('Failed to save product', e);
    } finally {
      setSubmitting(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null });

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchData();
      setDeleteConfirm({ open: false, productId: null });
    } catch (e) {
      console.error('Failed to delete', e);
    }
  };

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

  if (loading) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-32 flex justify-center">
          <Activity className="w-10 h-10 text-safety-orange animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <SectionHeading title="Seller Portal" annotation="Manage Your Store" dark={true} />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          {[
            { label: 'Products', value: products.length, icon: Package },
            { label: 'Total Orders', value: orders.length, icon: ShoppingCart },
            { label: 'Revenue', value: `₱${totalRevenue.toLocaleString()}`, icon: BarChart3 },
            { label: 'Pending', value: orders.filter((o: any) => o.status === 'pending').length, icon: Activity },
          ].map(stat => (
            <div key={stat.label} className="p-4 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm">
              <stat.icon className="w-5 h-5 text-safety-orange mb-2" />
              <p className="text-2xl font-black text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-8 flex gap-2 flex-wrap bg-[var(--bg-surface)] p-1 rounded-sm border border-[var(--border-primary)] inline-flex">
            {['products', 'orders', 'analytics'].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="px-4 sm:px-6 py-2.5 rounded-sm font-black uppercase text-xs tracking-tighter transition-all data-[state=active]:bg-safety-orange data-[state=active]:text-white text-[var(--text-muted)]"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[var(--text-primary)] uppercase">My Products ({products.length})</h3>
              <Button size="sm" onClick={() => { resetForm(); setShowAddProduct(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            </div>

            {/* Add/Edit Product Form */}
            <AnimatePresence>
              {showAddProduct && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Card className="mb-8 border-2 border-safety-orange/30">
                    <h4 className="text-lg font-black text-[var(--text-on-card)] uppercase mb-6">
                      {editingProduct ? 'Edit Product' : 'New Product'}
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Product Name</label>
                          <Input placeholder="e.g., Arduino Mega 2560" className="h-10 text-sm" value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">SKU</label>
                          <Input placeholder="e.g., XTS-ARD-001" className="h-10 text-sm" value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Price (PHP)</label>
                          <Input type="number" placeholder="0.00" min="0" className="h-10 text-sm" value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Stock</label>
                          <Input type="number" placeholder="0" min="0" className="h-10 text-sm" value={formData.stock}
                            onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Rating</label>
                          <Input type="number" placeholder="4.5" step="0.1" min="0" max="5" className="h-10 text-sm" value={formData.rating}
                            onChange={e => setFormData({ ...formData, rating: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Total Sold</label>
                          <Input type="number" placeholder="0" min="0" className="h-10 text-sm" value={formData.totalSold}
                            onChange={e => setFormData({ ...formData, totalSold: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Category</label>
                          <select className="flex h-10 w-full rounded-sm border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-on-input)] appearance-none"
                            value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                            {['Components', 'Modules', 'Sensors', 'Tools', 'Kits', 'Accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Tag</label>
                          <select className="flex h-10 w-full rounded-sm border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-on-input)] appearance-none"
                            value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })}>
                            {['New', 'Best Seller', 'Sale', 'Featured', 'Limited'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Description</label>
                        <Textarea placeholder="Product description..." className="min-h-[80px] text-sm" value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })} />
                      </div>

                      {/* Specifications */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Specifications</label>
                          <Button size="sm" variant="outline" className="text-[10px] h-7 px-2" onClick={addSpecField}>
                            <Plus className="w-3 h-3 mr-1" /> Add Spec
                          </Button>
                        </div>
                        {specs.map((spec, i) => (
                          <div key={i} className="flex gap-2">
                            <Input placeholder="Key (e.g. Voltage)" className="h-9 text-xs flex-1"
                              value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} />
                            <Input placeholder="Value (e.g. 5V)" className="h-9 text-xs flex-1"
                              value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} />
                            <button onClick={() => removeSpecField(i)} className="text-red-500 hover:text-red-400 px-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Product Images</label>
                        <div className="flex flex-wrap gap-3">
                          {existingImages.map((url, i) => (
                            <div key={`existing-${i}`} className="relative w-20 h-20 rounded-sm overflow-hidden border border-[var(--border-primary)]">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {imagePreviews.map((url, i) => (
                            <div key={`new-${i}`} className="relative w-20 h-20 rounded-sm overflow-hidden border-2 border-safety-orange">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className="w-20 h-20 border-2 border-dashed border-[var(--border-primary)] rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-safety-orange transition-colors">
                            <Upload className="w-5 h-5 text-[var(--text-muted)] mb-1" />
                            <span className="text-[8px] text-[var(--text-muted)] font-bold">ADD</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
                        <Button className="flex-1" onClick={handleSubmit} disabled={submitting || !formData.name || !formData.price}>
                          {submitting ? <><Activity className="w-4 h-4 mr-1 animate-spin" /> Saving...</> : editingProduct ? 'Update Product' : 'Add Product'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <Card key={product.id} hoverEffect={false} className="relative">
                  <div className="aspect-video bg-[var(--bg-surface)] rounded-sm overflow-hidden mb-3 border border-[var(--border-secondary)]">
                    {product.imageUrls?.[0] ? (
                      <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-[var(--text-muted)] opacity-30" /></div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-black text-[var(--text-on-card)] uppercase">{product.name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)]">{product.sku}</p>
                    </div>
                    <Badge variant={product.stock > 0 ? 'completed' : 'warning'} className="text-[8px] shrink-0">
                      {product.stock > 0 ? `${product.stock} qty` : 'Out'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-safety-orange text-lg">₱{parseFloat(product.price).toLocaleString()}</span>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(product)} className="p-1.5 text-[var(--text-muted)] hover:text-safety-orange transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ open: true, productId: product.id })} className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {product.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-[var(--text-muted)]">{product.rating} • {product.totalSold || 0} sold</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-6">Orders ({orders.length})</h3>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--text-muted)]">No orders yet.</p>
                </div>
              ) : orders.map((order: any) => (
                <Card key={order.id} hoverEffect={false}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] font-mono mb-1">#{order.id?.slice(0, 8).toUpperCase()}</p>
                      <h4 className="text-sm font-bold text-[var(--text-on-card)]">{order.customerName}</h4>
                      <p className="text-xs text-[var(--text-muted)]">{order.items?.length || 0} items · ₱{order.total?.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={
                        order.status === 'completed' ? 'completed' :
                        order.status === 'shipped' || order.status === 'delivered' ? 'in-progress' :
                        order.status === 'processing' ? 'new' : 'pending'
                      }>{order.status}</Badge>

                      {/* Status Update Dropdown */}
                      <select
                        className="text-xs rounded-sm border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-on-input)] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-safety-orange appearance-none cursor-pointer"
                        value={order.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            const res = await fetch(`/api/orders/${order.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus }),
                            });
                            if (res.ok) {
                              fetchData();
                            }
                          } catch (err) {
                            console.error('Failed to update order status', err);
                          }
                        }}
                      >
                        {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'].map(phase => (
                          <option key={phase} value={phase}>
                            → {phase.charAt(0).toUpperCase() + phase.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status Phase Bar */}
                  <div className="mt-4 flex items-center gap-1">
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'].map((phase, i) => {
                      const phases = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
                      const currentIdx = phases.indexOf(order.status);
                      const isActive = i <= currentIdx;
                      return (
                        <div key={phase} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`h-1.5 w-full rounded-full transition-colors ${isActive ? 'bg-safety-orange' : 'bg-[var(--border-primary)]'}`} />
                          <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? 'text-safety-orange' : 'text-[var(--text-muted)]'}`}>
                            {phase.slice(0, 4)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status History */}
                  {order.statusHistory && order.statusHistory.length > 0 && (
                    <details className="mt-3 pt-3 border-t border-[var(--border-secondary)]">
                      <summary className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest cursor-pointer hover:text-[var(--text-secondary)] transition-colors">
                        Status History ({order.statusHistory.length})
                      </summary>
                      <div className="mt-2 space-y-1.5">
                        {order.statusHistory.map((h: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                            <span className="font-bold text-[var(--text-secondary)] uppercase">{h.status}</span>
                            <span>—</span>
                            <span>{h.updatedBy}</span>
                            <span className="ml-auto font-mono">{new Date(h.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-6">Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card hoverEffect={false}>
                <h4 className="text-sm font-black text-[var(--text-on-card)] uppercase mb-4">Revenue Overview</h4>
                <p className="text-4xl font-black text-safety-orange mb-2">₱{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-muted)]">Total revenue from {orders.length} orders</p>
              </Card>
              <Card hoverEffect={false}>
                <h4 className="text-sm font-black text-[var(--text-on-card)] uppercase mb-4">Product Performance</h4>
                <div className="space-y-3">
                  {products.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)] truncate mr-4">{p.name}</span>
                      <span className="font-bold text-[var(--text-on-card)] shrink-0">{p.totalSold || 0} sold</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <ConfirmModal
        open={deleteConfirm.open}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Keep It"
        onConfirm={() => deleteConfirm.productId && handleDelete(deleteConfirm.productId)}
        onCancel={() => setDeleteConfirm({ open: false, productId: null })}
      />
    </PageShell>
  );
}
