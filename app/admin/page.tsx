"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Package, Users, Activity, Settings, Plus, Search, Hammer, AlertTriangle, MessageCircle, X, ClipboardList, Truck, CheckCircle2, ArrowUpDown, MapPin, Trash2, Edit2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'inventory';

  // State for live mock interaction
  const [inventory, setInventory] = React.useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = React.useState(true);

  const [users, setUsers] = React.useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);

  const [applications, setApplications] = React.useState<any[]>([]);
  const [loadingApps, setLoadingApps] = React.useState(true);

  const [orders, setOrders] = React.useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(true);

  const [consultations, setConsultations] = React.useState<any[]>([]);
  const [loadingConsultations, setLoadingConsultations] = React.useState(true);

  const [fabJobs, setFabJobs] = React.useState<any[]>([]);
  const [loadingFabJobs, setLoadingFabJobs] = React.useState(true);

  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = React.useState(false);
  const [loadingAudit, setLoadingAudit] = React.useState(false);

  // Pickup Points State
  const [pickupPoints, setPickupPoints] = React.useState<any[]>([]);
  const [loadingPickupPoints, setLoadingPickupPoints] = React.useState(true);
  const [showAddPickupForm, setShowAddPickupForm] = React.useState(false);
  const [addingPickupPoint, setAddingPickupPoint] = React.useState(false);
  const [editingPickupPoint, setEditingPickupPoint] = React.useState<any | null>(null);
  const [newPickupPoint, setNewPickupPoint] = React.useState({ name: '', address: '' });

  // Edit Product State
  const [editingProduct, setEditingProduct] = React.useState<any | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);

  // Form State
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [addingProduct, setAddingProduct] = React.useState(false);
  const [newProduct, setNewProduct] = React.useState({
    name: '',
    sku: '',
    price: 0,
    stock: 0,
    category: 'Hardware',
    description: '',
    tag: 'NEW ARRIVAL'
  });

  // Fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingUsers(true);
        setLoadingInventory(true);
        setLoadingOrders(true);
        setLoadingApps(true);
        setLoadingConsultations(true);
        setLoadingFabJobs(true);
        setLoadingPickupPoints(true);

        const [userRes, prodRes, appRes, consultRes, orderRes, fabRes, pickupRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/products'),
          fetch('/api/applications'),
          fetch('/api/consultations'),
          fetch('/api/orders'),
          fetch('/api/fabrication'),
          fetch('/api/pickup-points'),
        ]);

        if (userRes.ok) setUsers(await userRes.json());
        if (prodRes.ok) setInventory(await prodRes.json());
        if (appRes.ok) setApplications(await appRes.json());
        if (consultRes.ok) setConsultations(await consultRes.json());
        if (orderRes.ok) setOrders(await orderRes.json());
        if (fabRes.ok) setFabJobs(await fabRes.json());
        if (pickupRes.ok) setPickupPoints(await pickupRes.json());
        
      } catch (e) {
        console.error("Failed to sync system registry", e);
      } finally {
        setLoadingUsers(false);
        setLoadingInventory(false);
        setLoadingOrders(false);
        setLoadingApps(false);
        setLoadingConsultations(false);
        setLoadingFabJobs(false);
        setLoadingPickupPoints(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // Actions
  const approveExpert = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id));
        // Refresh users to see new role
        const userRes = await fetch('/api/users');
        if (userRes.ok) setUsers(await userRes.json());
      }
    } catch (e) {
       console.error("Failed to approve expert", e);
    }
  };

  const declineExpert = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
       console.error("Failed to decline expert", e);
    }
  };

  const toggleRole = async (userId: string, currentRole: string, roleToToggle: string) => {
    let roles = currentRole ? currentRole.split(',') : ['member'];
    
    if (roles.includes(roleToToggle)) {
      // Remove if not only role or default to member
      roles = roles.filter(r => r !== roleToToggle);
      if (roles.length === 0) roles = ['member'];
    } else {
      // Add and remove member if it was there
      roles = [...roles, roleToToggle].filter(r => r !== 'member');
    }
    
    const nextRole = roles.join(',');

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
      }
    } catch (e) {
      console.error("Failed to update clearance", e);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInventory(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error("Failed to decommission product", e);
    }
  };

  const shipOrder = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      }
    } catch (e) {
      console.error('Failed to update order', e);
    }
  };

  const confirmSession = async (id: string) => {
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      if (res.ok) {
        setConsultations(prev => prev.map(s => s.id === id ? { ...s, status: 'confirmed' } : s));
      }
    } catch (e) {
      console.error('Failed to confirm session', e);
    }
  };

  const updateFabJob = async (id: string, status: string, progress: number) => {
    try {
      const res = await fetch(`/api/fabrication/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, progress }),
      });
      if (res.ok) {
        setFabJobs(prev => prev.map(j => j.id === id ? { ...j, status, progress } : j));
      }
    } catch (e) {
      console.error('Failed to update fab job', e);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProduct.name,
          sku: editingProduct.sku,
          price: editingProduct.price,
          stock: editingProduct.stock,
          category: editingProduct.category,
          description: editingProduct.description,
          tag: editingProduct.tag,
        }),
      });
      if (res.ok) {
        setInventory(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...editingProduct } : p));
        setEditingProduct(null);
      }
    } catch (e) {
      console.error('Failed to update product', e);
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchAuditLogs = async () => {
    setShowAuditModal(true);
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/audit');
      if (res.ok) setAuditLogs(await res.json());
    } catch (e) {
      console.error('Failed to fetch audit logs', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Pickup Point CRUD
  const handleAddPickupPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPickupPoint(true);
    try {
      const res = await fetch('/api/pickup-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPickupPoint),
      });
      if (res.ok) {
        const point = await res.json();
        setPickupPoints(prev => [point, ...prev]);
        setShowAddPickupForm(false);
        setNewPickupPoint({ name: '', address: '' });
      }
    } catch (e) {
      console.error('Failed to add pickup point', e);
    } finally {
      setAddingPickupPoint(false);
    }
  };

  const handleEditPickupPoint = async () => {
    if (!editingPickupPoint) return;
    try {
      const res = await fetch(`/api/pickup-points/${editingPickupPoint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingPickupPoint.name, address: editingPickupPoint.address }),
      });
      if (res.ok) {
        setPickupPoints(prev => prev.map(p => p.id === editingPickupPoint.id ? { ...p, ...editingPickupPoint } : p));
        setEditingPickupPoint(null);
      }
    } catch (e) {
      console.error('Failed to update pickup point', e);
    }
  };

  const handleDeletePickupPoint = async (id: string) => {
    try {
      const res = await fetch(`/api/pickup-points/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPickupPoints(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete pickup point', e);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      if (res.ok) {
        const product = await res.json();
        setInventory(prev => [product, ...prev]);
        setShowAddForm(false);
        setNewProduct({
          name: '',
          sku: '',
          price: 0,
          stock: 0,
          category: 'Hardware',
          description: '',
          tag: 'NEW ARRIVAL'
        });
      }
    } catch (e) {
      console.error("Failed to manifest product", e);
    } finally {
      setAddingProduct(false);
    }
  };

  // Redirect if not admin or expert
  React.useEffect(() => {
    const role = (session?.user as any)?.role || '';
    if (status === 'unauthenticated' || (status === 'authenticated' && !role.includes('admin') && !role.includes('expert'))) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  const userRole = (session?.user as any)?.role || 'member';

  if (status === 'loading') {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[50vh]">
          <div className="font-mono text-safety-orange animate-pulse uppercase tracking-widest">
            Synchronizing Neural Link...
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <Badge className={cn(
              "mb-2 uppercase",
              userRole.includes('admin') ? "bg-red-600 text-white" : "bg-safety-orange text-white"
            )}>
              {userRole.includes('admin') ? 'Root Administrator Access' : 'Expert Consultant Status'}
            </Badge>
            <SectionHeading 
              title={userRole.includes('admin') ? "Command Terminal" : "Expert Portal"} 
              annotation={userRole.includes('admin') ? "L-5 Clearance" : "Consultant Access"} 
              dark={true}
              className="mb-0"
            />
          </div>
          <div className="flex gap-4">
            <div className="hidden md:flex flex-col items-end gap-1">
               <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Active Operator</span>
               <span className="text-xs font-bold text-white uppercase tracking-tighter">{session?.user?.name || 'Administrator'}</span>
            </div>
            <div className="w-px h-10 bg-white/10 mx-2" />
            <Button variant="outline" size="sm" className="bg-zinc-800 text-white border-zinc-700 flex gap-2" onClick={fetchAuditLogs}><ClipboardList className="w-3 h-3" /> Audit Logs</Button>
          </div>
        </div>

        <Tabs defaultValue={userRole === 'expert' ? 'consultations' : initialTab} className="w-full">
          <TabsList className="mb-12 flex flex-wrap gap-2 bg-zinc-900 border border-white/10 p-1 rounded-sm inline-flex">
            {userRole.includes('admin') && (
              <>
                <AdminTabTrigger value="inventory" icon={Package} label="Products" />
                <AdminTabTrigger value="orders" icon={Activity} label="Orders" />
                <AdminTabTrigger value="fabrication" icon={Hammer} label="Fabrication" />
                <AdminTabTrigger value="pickuppoints" icon={MapPin} label="Pickup Points" />
                <AdminTabTrigger value="applications" icon={Plus} label="Intake" />
                <AdminTabTrigger value="users" icon={Users} label="Permissions" />
              </>
            )}
            <AdminTabTrigger value="consultations" icon={MessageCircle} label="Consultations" />
          </TabsList>

          {userRole.includes('admin') && (
            <>

              <TabsContent value="inventory" className="space-y-8 mt-0">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
                   <div className="relative w-full md:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input placeholder="Search inventory..." className="pl-12 bg-zinc-900 border-zinc-800" />
                   </div>
                   <Button className="w-full md:w-auto flex gap-2" onClick={() => setShowAddForm(!showAddForm)}>
                     {showAddForm ? <AlertTriangle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                     {showAddForm ? 'Cancel Entry' : 'Add New Item'}
                   </Button>
                </div>

                {showAddForm && (
                  <Card className="border-2 border-safety-orange/20 overflow-hidden bg-black/40 mb-10">
                    <form onSubmit={handleAddProduct} className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Model Name</label>
                          <Input required placeholder="Industrial Servo" className="bg-zinc-900 border-zinc-800" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Serial / SKU</label>
                          <Input required placeholder="XTS-SRV-001" className="bg-zinc-900 border-zinc-800" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Category</label>
                          <select className="flex h-10 w-full rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-safety-orange appearance-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                            {['Hardware', 'Robotics', 'Motion', 'Power', 'Sensors', 'Electronics'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">MSRP (PHP)</label>
                          <Input required type="number" step="0.01" className="bg-zinc-900 border-zinc-800" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Initial Logic Stock</label>
                          <Input required type="number" className="bg-zinc-900 border-zinc-800" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Status Tag</label>
                          <Input placeholder="NEW ARRIVAL" className="bg-zinc-900 border-zinc-800" value={newProduct.tag} onChange={e => setNewProduct({...newProduct, tag: e.target.value})} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Technical Specifications</label>
                        <Textarea required placeholder="Describe torque, voltage, material, or architectural specs..." className="bg-zinc-900 border-zinc-800 min-h-[100px]" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={addingProduct} className="bg-red-600 hover:bg-red-700 h-12 px-10 uppercase text-xs font-black shadow-[0_4px_0_0_#991b1b]">
                          {addingProduct ? 'Manifesting...' : 'Add to Inventory'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {loadingInventory ? (
                  <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
                ) : inventory.length > 0 ? (
                  <div className="overflow-x-auto border border-white/5 rounded-sm bg-black/20">
                     <table className="w-full text-left border-collapse">
                        {/* ... table content remains same ... */}
                        <thead>
                          <tr className="border-b border-white/10 bg-zinc-900/50">
                            <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Model / Name</th>
                            <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Serial</th>
                            <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Qty</th>
                            <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">MSRP</th>
                            <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.map((item: any) => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              {/* ... row data ... */}
                              <td className="p-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-zinc-800 rounded-sm border border-white/10 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-zinc-600" />
                                  </div>
                                  <span className="text-sm font-bold text-white uppercase tracking-tighter">{item.name}</span>
                               </div>
                            </td>
                            <td className="p-4 text-xs font-mono text-zinc-400">{item.sku}</td>
                            <td className="p-4">
                               <div className="flex items-center gap-2">
                                  <span className="text-white font-bold">{item.stock}</span>
                                  {item.stock < 15 && <Badge variant="warning" className="text-[8px] h-4">RESTOCK</Badge>}
                               </div>
                            </td>
                             <td className="p-4 text-sm font-black text-safety-orange">PHP {item.price.toFixed(2)}</td>
                            <td className="p-4 text-right">
                               <div className="flex gap-2 justify-end">
                                   <Button variant="outline" size="sm" className="px-2 h-8 min-w-0" onClick={() => setEditingProduct({...item})}>Edit</Button>
                                   <Button variant="ghost" size="sm" className="px-2 h-8 min-w-0 text-red-500" onClick={() => deleteProduct(item.id)}>Delete</Button>
                               </div>
                            </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                  </div>
                ) : (
                  <EmptyTerminalState 
                    icon={Package} 
                    title="Inventory Empty" 
                    description="No products are registered in the store database." 
                  />
                )}
              </TabsContent>

              {/* Orders Management */}
              <TabsContent value="orders" className="space-y-8 mt-0">
                <div className="mb-10">
                   <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Transaction Registry</h3>
                   <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Confirmed Procurement History</p>
                </div>

                {loadingOrders ? (
                  <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
                ) : orders.length > 0 ? (
                  <div className="overflow-x-auto border border-white/5 rounded-sm bg-black/20">
                     <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="border-b border-white/10 bg-zinc-900/50">
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Order ID</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Customer</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Items</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Delivery</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Total</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Status</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order: any) => (
                          <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 text-xs font-mono text-safety-orange font-black">{order.id?.slice(0, 8).toUpperCase()}</td>
                            <td className="p-4">
                              <div>
                                <span className="text-sm font-bold text-white uppercase tracking-tighter block">{order.customerName}</span>
                                <span className="text-[10px] text-zinc-500 font-mono">{order.customerEmail}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {(order.items || []).slice(0, 2).map((item: any, i: number) => (
                                  <span key={i} className="text-xs text-zinc-400 block">{item.name} x{item.quantity}</span>
                                ))}
                                {(order.items || []).length > 2 && <span className="text-[10px] text-zinc-600">+{order.items.length - 2} more</span>}
                              </div>
                            </td>
                            <td className="p-4">
                              {order.deliveryMethod === 'pickup' ? (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                                  <span className="text-xs text-blue-400 font-bold">{order.pickupPointName || 'Pickup'}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Truck className="w-3 h-3 text-safety-orange shrink-0" />
                                  <span className="text-xs text-zinc-400 font-bold">Standard</span>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-sm font-black text-white">PHP {(order.total || 0).toFixed(2)}</td>
                            <td className="p-4">
                               <Badge variant={order.status === 'delivered' ? 'completed' : order.status === 'shipped' ? 'in-progress' : 'pending'}>{(order.status || 'processing').toUpperCase()}</Badge>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex gap-2 justify-end">
                               {order.status === 'processing' && (
                                 <Button variant="outline" size="sm" className="text-[10px] bg-blue-600/10 text-blue-400 border-blue-500/20 flex gap-1" onClick={() => shipOrder(order.id, 'shipped')}><Truck className="w-3 h-3" /> Ship</Button>
                               )}
                               {order.status === 'shipped' && (
                                 <Button variant="outline" size="sm" className="text-[10px] bg-green-600/10 text-green-500 border-green-500/20 flex gap-1" onClick={() => shipOrder(order.id, 'delivered')}><CheckCircle2 className="w-3 h-3" /> Delivered</Button>
                               )}
                               {order.status === 'delivered' && (
                                 <Badge variant="completed" className="text-[8px]">COMPLETE</Badge>
                               )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                     </table>
                  </div>
                ) : (
                  <EmptyTerminalState 
                    icon={Activity} 
                    title="No Transactions" 
                    description="The procurement registry is currently empty." 
                  />
                )}
              </TabsContent>

              {/* User & Permissions */}
              <TabsContent value="users" className="space-y-8 mt-0">
                <div className="flex justify-between items-center mb-10">
                    <div>
                       <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Clearance Registry</h3>
                       <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Personnel Permissions Control</p>
                    </div>
                </div>

                {loadingUsers ? (
                   <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto overflow-x-auto border border-white/5 rounded-sm bg-black/20 custom-scrollbar">
                     <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className="border-b border-white/10 bg-zinc-900">
                            <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Operational Name</th>
                            <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Comm Link</th>
                            <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Clearance</th>
                            <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(u => (
                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 shrink-0",
                                    u.role === 'admin' ? "bg-red-600/20 text-red-500 ring-red-500/50" : 
                                    u.role === 'expert' ? "bg-safety-orange/20 text-safety-orange ring-safety-orange/50" : 
                                    "bg-zinc-800 text-zinc-500 ring-white/10"
                                  )}>
                                    {(u.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                                  </div>
                                  <span className="text-sm font-bold text-white uppercase tracking-tighter truncate max-w-[150px]">{u.name || 'Anonymous User'}</span>
                                </div>
                              </td>
                              <td className="p-4 text-xs font-mono text-zinc-500">{u.email}</td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-1">
                                  {(u.role || 'member').split(',').map((r: string) => (
                                    <Badge key={r} className={cn(
                                      "whitespace-nowrap text-[8px] px-1 h-4",
                                      r === 'admin' ? "bg-red-600 text-white" : 
                                      r === 'expert' ? "bg-safety-orange text-white" : 
                                      "bg-zinc-800 text-zinc-400"
                                    )}>
                                      {r === 'admin' ? 'ADMIN' : r.toUpperCase()}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn(
                                      "h-7 text-[9px] border transition-all px-2 uppercase font-black",
                                      (u.role || '').includes('expert') ? "bg-safety-orange text-white border-safety-orange" : "bg-transparent text-zinc-500 border-white/5 hover:border-safety-orange"
                                    )}
                                    onClick={() => toggleRole(u.id, u.role, 'expert')}
                                  >
                                    Expert
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn(
                                      "h-7 text-[9px] border transition-all px-2 uppercase font-black",
                                      (u.role || '').includes('admin') ? "bg-red-600 text-white border-red-600" : "bg-transparent text-zinc-500 border-white/5 hover:border-red-600"
                                    )}
                                    onClick={() => toggleRole(u.id, u.role, 'admin')}
                                  >
                                    Admin
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                  </div>
                )}
              </TabsContent>

              {/* Expert Intake Management */}
              <TabsContent value="applications" className="space-y-8 mt-0">
                <div className="mb-10">
                   <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Specialist Intake</h3>
                   <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Pending Professional Verifications</p>
                </div>

                {applications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {applications.map((app) => (
                        <Card key={app.id} className="relative border border-white/5 hover:border-safety-orange/50 transition-colors bg-black/40">
                          <div className="flex justify-between items-start mb-6">
                             <div>
                                <Badge variant="new" className="mb-2">EXPERT APPLICATION</Badge>
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">{app.name}</h4>
                                <p className="text-xs text-zinc-500 font-mono mt-1">Reference: {app.id}</p>
                             </div>
                             <Badge variant="pending" className="bg-zinc-900 text-zinc-500 border-zinc-800">{app.status}</Badge>
                          </div>
                          
                          <div className="bg-zinc-900 p-4 rounded-sm border border-white/5 mb-6">
                             <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Stated Expertise</span>
                             <p className="text-sm text-zinc-300 font-medium tracking-tight uppercase">{app.expertise}</p>
                          </div>

                          <div className="flex gap-4">
                              <Button className="flex-grow bg-green-600 hover:bg-green-700 h-10 uppercase text-[10px] shadow-[0_4px_0_0_#166534]" onClick={() => approveExpert(app.id)}>Verify & Admit</Button>
                              <Button variant="outline" className="flex-grow h-10 uppercase text-[10px] border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={() => declineExpert(app.id)}>Decline</Button>
                          </div>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="py-24 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center bg-black/10">
                     <Users className="w-12 h-12 text-zinc-800 mb-4" />
                     <h4 className="text-lg font-black text-white uppercase tracking-tighter">Queue Nominal</h4>
                     <p className="text-xs text-zinc-500 max-w-xs font-medium uppercase mt-1">All engineering applications have been processed.</p>
                  </div>
                )}
              </TabsContent>

              {/* Fabrication Management */}
              <TabsContent value="fabrication" className="space-y-8 mt-0">
                <div className="mb-10">
                   <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Manufacturing Control</h3>
                   <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Active fabrication jobs and system status</p>
                </div>

                {loadingFabJobs ? (
                  <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
                ) : fabJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fabJobs.map((job: any) => (
                      <Card key={job.id} className="border border-white/5 bg-black/40">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <Badge variant="new" className="mb-2 uppercase text-[8px]">{job.id?.slice(0, 8)}</Badge>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{job.name}</h4>
                            <p className="text-xs text-zinc-500 font-medium mt-1">Client: {job.customerName}</p>
                            {job.files && <p className="text-[10px] text-zinc-600 font-mono mt-1">{job.files.join(', ')}</p>}
                          </div>
                          <Badge variant={job.status === 'completed' ? 'completed' : job.status === 'in-progress' ? 'in-progress' : 'pending'}>
                            {(job.status || 'queued').toUpperCase()}
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase mb-1">
                            <span>Progress</span>
                            <span className="text-safety-orange">{job.progress || 0}%</span>
                          </div>
                          <div className="h-3 bg-zinc-900 rounded-sm border border-white/5 overflow-hidden">
                            <div className="h-full bg-safety-orange transition-all" style={{ width: `${job.progress || 0}%` }} />
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {job.status !== 'completed' && (
                            <>
                              <Button size="sm" className="text-[9px] uppercase font-black bg-blue-600 hover:bg-blue-700 h-7 px-3" onClick={() => updateFabJob(job.id, 'reviewing', 25)}>Review</Button>
                              <Button size="sm" className="text-[9px] uppercase font-black bg-safety-orange hover:bg-safety-orange/80 h-7 px-3" onClick={() => updateFabJob(job.id, 'in-progress', 60)}>In Progress</Button>
                              <Button size="sm" className="text-[9px] uppercase font-black bg-green-600 hover:bg-green-700 h-7 px-3" onClick={() => updateFabJob(job.id, 'completed', 100)}>Complete</Button>
                            </>
                          )}
                          {job.status === 'completed' && (
                            <Badge variant="completed" className="text-[9px]">JOB FULFILLED</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyTerminalState 
                    icon={Hammer} 
                    title="No Active Jobs" 
                    description="No fabrication requests pending. Jobs will appear here when customers submit quote requests." 
                  />
                )}
              </TabsContent>

              {/* Pickup Points Management */}
              <TabsContent value="pickuppoints" className="space-y-8 mt-0">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Pickup Point Registry</h3>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Manage local meetup locations for order pickups</p>
                  </div>
                  <Button className="w-full md:w-auto flex gap-2" onClick={() => setShowAddPickupForm(!showAddPickupForm)}>
                    {showAddPickupForm ? <AlertTriangle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showAddPickupForm ? 'Cancel' : 'Add Pickup Point'}
                  </Button>
                </div>

                {showAddPickupForm && (
                  <Card className="border-2 border-blue-500/20 overflow-hidden bg-black/40 mb-10">
                    <form onSubmit={handleAddPickupPoint} className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Location Name</label>
                          <Input required placeholder="Central Philippine University" className="bg-zinc-900 border-zinc-800" value={newPickupPoint.name} onChange={e => setNewPickupPoint({...newPickupPoint, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Address / Details</label>
                          <Input required placeholder="CPU GAD Office, Jaro, Iloilo City" className="bg-zinc-900 border-zinc-800" value={newPickupPoint.address} onChange={e => setNewPickupPoint({...newPickupPoint, address: e.target.value})} />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={addingPickupPoint} className="bg-blue-600 hover:bg-blue-700 h-12 px-10 uppercase text-xs font-black shadow-[0_4px_0_0_#1d4ed8]">
                          {addingPickupPoint ? 'Adding...' : 'Add Pickup Point'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {loadingPickupPoints ? (
                  <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
                ) : pickupPoints.length > 0 ? (
                  <div className="space-y-4">
                    {pickupPoints.map((point: any) => (
                      <Card key={point.id} className="border border-white/5 bg-black/40">
                        {editingPickupPoint?.id === point.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Name</label>
                                <Input className="bg-zinc-800 border-zinc-700" value={editingPickupPoint.name} onChange={e => setEditingPickupPoint({...editingPickupPoint, name: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Address</label>
                                <Input className="bg-zinc-800 border-zinc-700" value={editingPickupPoint.address} onChange={e => setEditingPickupPoint({...editingPickupPoint, address: e.target.value})} />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setEditingPickupPoint(null)}>Cancel</Button>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleEditPickupPoint}>Save</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center justify-center shrink-0">
                                <MapPin className="w-6 h-6 text-blue-500" />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">{point.name}</h4>
                                <p className="text-xs text-zinc-500 font-medium">{point.address}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button variant="outline" size="sm" className="px-2 h-8 min-w-0" onClick={() => setEditingPickupPoint({...point})}><Edit2 className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="px-2 h-8 min-w-0 text-red-500" onClick={() => handleDeletePickupPoint(point.id)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyTerminalState
                    icon={MapPin}
                    title="No Pickup Points"
                    description="Add local meetup points where buyers can pick up their orders."
                  />
                )}
              </TabsContent>
            </>
          )}

          {/* Consultation Management (For Admins and Experts) */}
          <TabsContent value="consultations" className="space-y-8 mt-0">
            <div className="mb-10">
               <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Session Control</h3>
               <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Manage technical consultations and design reviews</p>
            </div>

             {loadingConsultations ? (
              <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
            ) : consultations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {consultations.map((consult: any) => (
                    <Card key={consult.id} className="border border-white/5 bg-black/40">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                            <Badge variant="new" className="mb-2 uppercase">Session Protocol</Badge>
                            <h4 className="text-xl font-black text-white uppercase tracking-tight">{consult.expertName}</h4>
                            <p className="text-xs text-zinc-500 font-medium">Client: {consult.clientName || consult.clientEmail}</p>
                            <p className="text-[10px] text-zinc-600 font-mono mt-1">{consult.expertTitle}</p>
                        </div>
                        <Badge variant={consult.status === 'confirmed' ? 'completed' : 'pending'}>
                          {(consult.status || 'pending').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-sm mb-6 border border-white/5">
                          <Activity className="w-4 h-4 text-safety-orange" />
                          <span className="text-xs font-mono text-zinc-400">{consult.slot || 'TBD'} — {consult.expertPrice}</span>
                      </div>

                      <div className="flex gap-4">
                          {consult.status === 'pending' ? (
                            <Button className="flex-grow bg-green-600 hover:bg-green-700 uppercase font-black text-[10px]" onClick={() => confirmSession(consult.id)}>Accept Session</Button>
                          ) : (
                            <Button className="flex-grow bg-safety-orange hover:bg-safety-orange/80 uppercase font-black text-[10px]">Prepare Files</Button>
                          )}
                          <Button variant="outline" className="flex-grow uppercase font-black text-[10px]">Details</Button>
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <EmptyTerminalState 
                icon={MessageCircle} 
                title="No Sessions" 
                description="Engineering consultation docket is currently clear." 
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !savingEdit && setEditingProduct(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-zinc-900 border border-white/10 rounded-sm shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="bg-red-600 p-1">
                <div className="bg-zinc-900 p-6 flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Edit Product</h3>
                  <button onClick={() => setEditingProduct(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Name</label>
                    <Input className="bg-zinc-800 border-zinc-700" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">SKU</label>
                    <Input className="bg-zinc-800 border-zinc-700" value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Price (PHP)</label>
                    <Input type="number" step="0.01" className="bg-zinc-800 border-zinc-700" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Stock</label>
                    <Input type="number" className="bg-zinc-800 border-zinc-700" value={editingProduct.stock || ''} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Category</label>
                    <select className="flex h-10 w-full rounded-sm border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-safety-orange appearance-none" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                      {['Hardware', 'Robotics', 'Motion', 'Power', 'Sensors', 'Electronics'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tag</label>
                  <Input className="bg-zinc-800 border-zinc-700" value={editingProduct.tag || ''} onChange={e => setEditingProduct({...editingProduct, tag: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Description</label>
                  <Textarea className="bg-zinc-800 border-zinc-700 min-h-[80px]" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                </div>
              </div>
              <div className="p-6 pt-0 flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditingProduct(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleEditProduct} disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit Logs Modal */}
      <AnimatePresence>
        {showAuditModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAuditModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-zinc-900 border border-white/10 rounded-sm shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="bg-safety-orange p-1">
                <div className="bg-zinc-900 p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">System Audit Trail</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Recent administrative actions</p>
                  </div>
                  <button onClick={() => setShowAuditModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                {loadingAudit ? (
                  <div className="py-12 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
                ) : auditLogs.length > 0 ? (
                  <div className="space-y-3">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="flex gap-4 p-3 bg-black/30 rounded-sm border border-white/5">
                        <div className="w-8 h-8 bg-zinc-800 rounded-sm flex items-center justify-center shrink-0 border border-white/5">
                          <Activity className="w-4 h-4 text-safety-orange" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="new" className="text-[7px] px-1 h-4 shrink-0">{log.action}</Badge>
                            <span className="text-[10px] text-zinc-600 truncate">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                          </div>
                          <p className="text-xs text-zinc-400">{log.details}</p>
                          <p className="text-[10px] text-zinc-600 font-mono mt-1">by {log.actor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <ClipboardList className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                    <p className="text-sm text-zinc-500 font-bold uppercase">No audit entries yet</p>
                    <p className="text-xs text-zinc-600 mt-1">Actions will be logged as they occur.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

const AdminTabTrigger = ({ value, icon: Icon, label }: { value: string, icon: any, label: string }) => (
  <TabsTrigger value={value} className="px-6 py-4 rounded-sm font-black uppercase text-[10px] tracking-widest transition-all data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_0_0_#991b1b] text-zinc-500 flex items-center gap-2 border-none bg-transparent whitespace-nowrap">
    <Icon className="w-3 h-3" />
    {label}
  </TabsTrigger>
);

const EmptyTerminalState = ({ icon: Icon, title, description }: any) => (
  <div className="py-24 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center bg-black/10">
    <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center mb-6">
      <Icon className="w-8 h-8 text-zinc-700" />
    </div>
    <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{title}</h4>
    <p className="text-sm text-zinc-500 max-w-sm font-medium">{description}</p>
  </div>
);

export default function AdminPage() {
  return (
    <Suspense fallback={
      <PageShell>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[50vh]">
          <div className="font-mono text-safety-orange animate-pulse uppercase tracking-widest">
            Initializing Encrypted Link...
          </div>
        </div>
      </PageShell>
    }>
      <AdminPanel />
    </Suspense>
  );
}
