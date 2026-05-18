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
import { Package, Users, Activity, Settings, Plus, Search, Hammer, AlertTriangle, MessageCircle, X, ClipboardList, Truck, CheckCircle2, ArrowUpDown, MapPin, Trash2, Edit2, Download, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'orders';

  // State for live mock interaction
  const [inventory, setInventory] = React.useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = React.useState(true);

  const [users, setUsers] = React.useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);

  const [applications, setApplications] = React.useState<any[]>([]);
  const [loadingApps, setLoadingApps] = React.useState(true);

  const [orders, setOrders] = React.useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(true);
  // Server-side pagination state for the transaction registry. The registry
  // only shows the last 2 days of orders to keep the view scalable.
  const ORDERS_PAGE_SIZE = 10;
  const ORDERS_WINDOW_DAYS = 2;
  const [ordersPage, setOrdersPage] = React.useState(1);
  const [ordersTotal, setOrdersTotal] = React.useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = React.useState(1);

  const [consultations, setConsultations] = React.useState<any[]>([]);
  const [loadingConsultations, setLoadingConsultations] = React.useState(true);
  const [selectedConsultation, setSelectedConsultation] = React.useState<any | null>(null);
  const [consultationEdits, setConsultationEdits] = React.useState<{
    expertName: string;
    expertId: string;
    expertPrice: string;
    slot: string;
  } | null>(null);
  const [savingConsultation, setSavingConsultation] = React.useState(false);
  const [consultationMessages, setConsultationMessages] = React.useState<any[]>([]);
  const [loadingConsultationMessages, setLoadingConsultationMessages] = React.useState(false);
  const [newConsultationMessage, setNewConsultationMessage] = React.useState('');
  const [sendingConsultationMessage, setSendingConsultationMessage] = React.useState(false);
  const consultationMessagesEndRef = React.useRef<HTMLDivElement>(null);
  const consultationMessagesContainerRef = React.useRef<HTMLDivElement>(null);

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
          fetch(`/api/orders?paginated=1&days=${ORDERS_WINDOW_DAYS}&page=1&pageSize=${ORDERS_PAGE_SIZE}`),
          fetch('/api/fabrication'),
          fetch('/api/pickup-points'),
        ]);

        if (userRes.ok) setUsers(await userRes.json());
        if (prodRes.ok) setInventory(await prodRes.json());
        if (appRes.ok) setApplications(await appRes.json());
        if (consultRes.ok) setConsultations(await consultRes.json());
        if (orderRes.ok) {
          const data = await orderRes.json();
          setOrders(data.orders || []);
          setOrdersTotal(data.total || 0);
          setOrdersTotalPages(data.totalPages || 1);
          setOrdersPage(data.page || 1);
        }
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

  const fetchOrdersPage = React.useCallback(async (page: number) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?paginated=1&days=${ORDERS_WINDOW_DAYS}&page=${page}&pageSize=${ORDERS_PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setOrdersTotal(data.total || 0);
        setOrdersTotalPages(data.totalPages || 1);
        setOrdersPage(data.page || 1);
      }
    } catch (e) {
      console.error('Failed to fetch orders page', e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

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

  const updateConsultation = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setConsultations(prev => prev.map(s => s.id === id ? { ...s, status } : s));
        if (selectedConsultation?.id === id) {
          setSelectedConsultation((prev: any) => prev ? { ...prev, status } : null);
        }
      }
    } catch (e) {
      console.error('Failed to update consultation', e);
    }
  };

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

  const confirmSession = async (id: string) => updateConsultation(id, 'confirmed');

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
                <AdminTabTrigger value="orders" icon={Activity} label="Orders" />
                <AdminTabTrigger value="fabrication" icon={Hammer} label="Fabrication" />
                <AdminTabTrigger value="pickuppoints" icon={MapPin} label="Pickup Points" />
                <AdminTabTrigger value="users" icon={Users} label="Permissions" />
              </>
            )}
            <AdminTabTrigger value="consultations" icon={MessageCircle} label="Consultations" />
          </TabsList>

          {userRole.includes('admin') && (
            <>
              {/* Orders Management */}
              <TabsContent value="orders" className="space-y-8 mt-0">
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                   <div>
                     <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Transaction Registry</h3>
                     <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">
                       Confirmed Procurement History — Last {ORDERS_WINDOW_DAYS} Days
                     </p>
                   </div>
                   <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                     {ordersTotal > 0 ? (
                       <>Showing <span className="text-white font-bold">{Math.min((ordersPage - 1) * ORDERS_PAGE_SIZE + 1, ordersTotal)}</span>–<span className="text-white font-bold">{Math.min(ordersPage * ORDERS_PAGE_SIZE, ordersTotal)}</span> of <span className="text-safety-orange font-black">{ordersTotal}</span></>
                     ) : (
                       <>0 records</>
                     )}
                   </div>
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
                    description={`No procurements in the last ${ORDERS_WINDOW_DAYS} days.`}
                  />
                )}

                {ordersTotalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ordersPage <= 1 || loadingOrders}
                      onClick={() => fetchOrdersPage(ordersPage - 1)}
                      className="text-[10px] uppercase font-black"
                    >
                      Prev
                    </Button>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                      Page <span className="text-white font-bold">{ordersPage}</span> of <span className="text-white font-bold">{ordersTotalPages}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ordersPage >= ordersTotalPages || loadingOrders}
                      onClick={() => fetchOrdersPage(ordersPage + 1)}
                      className="text-[10px] uppercase font-black"
                    >
                      Next
                    </Button>
                  </div>
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
                          <div className="flex-grow min-w-0 pr-4">
                            <Badge variant="new" className="mb-2 uppercase text-[8px]">{job.id?.slice(0, 8)}</Badge>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{job.name}</h4>
                            <p className="text-xs text-zinc-500 font-black mt-1 uppercase tracking-widest">Client: <span className="text-white bg-black/50 px-2 py-0.5 rounded-sm">{job.customerName}</span></p>
                            
                            {/* Downloadable Files */}
                            {job.files && job.files.length > 0 && (
                              <div className="mt-4 flex flex-col gap-3">
                                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest border-b border-white/5 pb-2">Design Files</span>
                                {job.files.map((file: string, idx: number) => {
                                  // Fallback to # if the backend hasn't resolved fileUrl mappings
                                  const downloadUrl = (job.fileUrls && job.fileUrls[idx]) ? job.fileUrls[idx] : '#';
                                  return (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900 border border-white/10 rounded-sm shadow-sm relative overflow-hidden group">
                                      {/* background hover effect */}
                                      <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                      
                                      <div className="flex items-center gap-3 overflow-hidden z-10 w-full pr-4">
                                        <div className="w-10 h-10 rounded-sm bg-safety-orange/10 flex items-center justify-center shrink-0 border border-safety-orange/20">
                                          <Download className="w-5 h-5 text-safety-orange" />
                                        </div>
                                        <div className="min-w-0 flex-grow pr-4">
                                          <p className="text-sm font-black text-white truncate" title={file}>{file}</p>
                                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Ready for Download</p>
                                        </div>
                                        <a 
                                          href={downloadUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          onClick={(e) => {
                                            if (downloadUrl === '#') {
                                              e.preventDefault();
                                              const blob = new Blob([`[SIMULATED FILE]\nFilename: ${file}\n\nThis file was uploaded as a mock or before Cloud Storage was linked. Please check administrative records for the actual file.`], { type: 'text/plain' });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = file.includes('.') ? file : file + '.txt';
                                              document.body.appendChild(a);
                                              a.click();
                                              document.body.removeChild(a);
                                              URL.revokeObjectURL(url);
                                            }
                                          }}
                                          className="z-10 shrink-0 px-6 py-3 bg-safety-orange hover:bg-safety-orange/90 text-white text-[10px] font-black uppercase tracking-widest rounded-sm shadow-[0_4px_0_0_#995400] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 border border-orange-400"
                                        >
                                          <Download className="w-4 h-4" /> Download
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Service Parameters */}
                            {job.parameters && Object.keys(job.parameters).length > 0 && (
                              <div className="mt-4 bg-zinc-900/80 border border-white/5 rounded-sm p-3.5 w-full">
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Service Parameters</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                  {Object.entries(job.parameters).map(([k, v]) => (
                                    <div key={k} className="flex flex-col">
                                      <span className="text-[8px] font-black tracking-widest uppercase text-zinc-600">{k}</span>
                                      <span className="text-xs font-bold text-zinc-200 mt-0.5 break-words">{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {job.notes && (
                              <div className="mt-3 bg-yellow-950/20 border border-yellow-900/50 p-3 rounded-sm">
                                <p className="text-[9px] text-yellow-600/60 font-black uppercase tracking-widest mb-1.5">Client Notes</p>
                                <p className="text-xs text-yellow-500/90 italic leading-relaxed break-words">"{job.notes}"</p>
                              </div>
                            )}
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
                  {consultations.map((consult: any) => {
                    const statusVariant =
                      consult.status === 'completed' ? 'completed'
                      : consult.status === 'confirmed' ? 'confirmed'
                      : consult.status === 'cancelled' ? 'cancelled'
                      : 'pending';
                    return (
                    <Card key={consult.id} className="border border-white/5 bg-black/40">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                            <Badge variant="new" className="mb-2 uppercase">{consult.consultationType?.replace('-', ' ') || 'General'}</Badge>
                            <h4 className="text-xl font-black text-white uppercase tracking-tight">{consult.expertName}</h4>
                            <p className="text-xs text-zinc-500 font-medium">Client: {consult.clientName || consult.clientEmail}</p>
                            <p className="text-[10px] text-zinc-600 font-mono mt-1">{consult.expertTitle}</p>
                        </div>
                        <Badge variant={statusVariant}>
                          {(consult.status || 'pending').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-sm mb-4 border border-white/5">
                          <Activity className="w-4 h-4 text-safety-orange" />
                          <span className="text-xs font-mono text-zinc-400">{consult.slot || 'TBD'} — {consult.expertPrice}</span>
                      </div>

                      {consult.projectDescription && (
                        <div className="mb-4 p-3 bg-zinc-900/30 rounded-sm border border-white/5">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Project Brief</p>
                          <p className="text-xs text-zinc-400 line-clamp-2">{consult.projectDescription}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                          {consult.status === 'pending' && (
                            <>
                              <Button size="sm" className="flex-1 min-w-0 bg-green-600 hover:bg-green-700 uppercase font-black text-[10px]" onClick={() => confirmSession(consult.id)}>Accept</Button>
                              <Button size="sm" className="flex-1 min-w-0 bg-red-600/80 hover:bg-red-600 uppercase font-black text-[10px]" onClick={() => updateConsultation(consult.id, 'cancelled')}>Decline</Button>
                            </>
                          )}
                          {consult.status === 'confirmed' && (
                            <>
                              <Button size="sm" className="flex-1 min-w-0 bg-green-600 hover:bg-green-700 uppercase font-black text-[10px]" onClick={() => updateConsultation(consult.id, 'completed')}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                              </Button>
                              <Button size="sm" className="flex-1 min-w-0 bg-red-600/80 hover:bg-red-600 uppercase font-black text-[10px]" onClick={() => updateConsultation(consult.id, 'cancelled')}>Cancel</Button>
                            </>
                          )}
                          {(consult.status === 'completed' || consult.status === 'cancelled') && (
                            <Badge variant={consult.status === 'completed' ? 'completed' : 'cancelled'} className="text-[8px] px-3 py-1">
                              {consult.status.toUpperCase()}
                            </Badge>
                          )}
                          <Button size="sm" variant="outline" className="flex-1 min-w-0 uppercase font-black text-[10px]" onClick={() => {
                            setSelectedConsultation(consult);
                            setConsultationEdits({
                              expertName: consult.expertName || '',
                              expertId: consult.expertId || '',
                              expertPrice: consult.expertPrice || '',
                              slot: consult.slot || '',
                            });
                            fetchConsultationMessages(consult.id);
                          }}>Details</Button>
                      </div>
                    </Card>
                  );})}
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

      {/* Consultation Detail Modal */}
      <AnimatePresence>
        {selectedConsultation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setSelectedConsultation(null); setConsultationEdits(null); setConsultationMessages([]); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-zinc-900 border border-white/10 rounded-sm shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="bg-safety-orange p-1">
                <div className="bg-zinc-900 p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Session Details</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{selectedConsultation.consultationType?.replace('-', ' ') || 'General Consultation'}</p>
                  </div>
                  <button onClick={() => { setSelectedConsultation(null); setConsultationEdits(null); setConsultationMessages([]); }} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-grow custom-scrollbar space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</p>
                    <Badge variant={
                      selectedConsultation.status === 'completed' ? 'completed'
                      : selectedConsultation.status === 'confirmed' ? 'confirmed'
                      : selectedConsultation.status === 'cancelled' ? 'cancelled'
                      : 'pending'
                    } className="mt-1">
                      {(selectedConsultation.status || 'pending').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Submitted</p>
                    <p className="text-xs text-zinc-400 font-mono mt-1">{selectedConsultation.createdAt ? new Date(selectedConsultation.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Client</p>
                    <p className="text-sm text-white font-bold">{selectedConsultation.clientName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{selectedConsultation.clientEmail}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Assigned Expert</p>
                    <p className="text-sm text-white font-bold">{selectedConsultation.expertName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{selectedConsultation.expertTitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Schedule</p>
                    <p className="text-xs text-zinc-300 font-medium">{selectedConsultation.slot || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Budget</p>
                    <p className="text-xs text-zinc-300 font-medium">{selectedConsultation.expertPrice || 'TBD'}</p>
                  </div>
                </div>

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

                {selectedConsultation.projectDescription && (
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Project Description</p>
                    <div className="p-4 bg-black/30 rounded-sm border border-white/5">
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedConsultation.projectDescription}</p>
                    </div>
                  </div>
                )}

                {selectedConsultation.requiredSkills && (
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Required Skills / Tools</p>
                    <div className="p-4 bg-black/30 rounded-sm border border-white/5">
                      <p className="text-xs text-zinc-300 leading-relaxed">{selectedConsultation.requiredSkills}</p>
                    </div>
                  </div>
                )}

                {/* Consultation Chat */}
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Consultation Chat</p>
                  <div className="border border-white/5 rounded-sm overflow-hidden bg-black/20">
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

                {/* Actions */}
                <div className="pt-4 border-t border-white/5 flex gap-3">
                  {selectedConsultation.status === 'pending' && (
                    <>
                      <Button className="flex-grow bg-green-600 hover:bg-green-700 uppercase font-black text-[10px]" onClick={() => updateConsultation(selectedConsultation.id, 'confirmed')}>Accept Session</Button>
                      <Button className="flex-grow bg-red-600/80 hover:bg-red-600 uppercase font-black text-[10px]" onClick={() => updateConsultation(selectedConsultation.id, 'cancelled')}>Decline</Button>
                    </>
                  )}
                  {selectedConsultation.status === 'confirmed' && (
                    <>
                      <Button className="flex-grow bg-green-600 hover:bg-green-700 uppercase font-black text-[10px]" onClick={() => updateConsultation(selectedConsultation.id, 'completed')}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Complete
                      </Button>
                      <Button className="flex-grow bg-red-600/80 hover:bg-red-600 uppercase font-black text-[10px]" onClick={() => updateConsultation(selectedConsultation.id, 'cancelled')}>Cancel</Button>
                    </>
                  )}
                </div>
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
