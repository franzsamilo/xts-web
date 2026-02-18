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
import { Package, Users, Activity, Settings, Plus, Search, Hammer, AlertTriangle, MessageCircle } from 'lucide-react';

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
        // Users
        const userRes = await fetch('/api/users');
        if (userRes.ok) setUsers(await userRes.json());
        
        // Products
        const prodRes = await fetch('/api/products');
        if (prodRes.ok) setInventory(await prodRes.json());
      } catch (e) {
        console.error("Failed to sync system registry", e);
      } finally {
        setLoadingUsers(false);
        setLoadingInventory(false);
        setLoadingOrders(false);
        setLoadingApps(false);
        setLoadingConsultations(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // Actions
  const approveExpert = (id: string) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    setUsers(prev => [...prev, { 
      id: Math.random().toString(), 
      name: app.name, 
      email: `${app.name.toLowerCase().replace(' ', '.')}@expert.xts`,
      role: 'expert',
      status: 'offline'
    }]);
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  const declineExpert = (id: string) => {
    setApplications(prev => prev.filter(a => a.id !== id));
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

  const shipOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'shipped' } : o));
  };

  const confirmSession = (id: string) => {
    setConsultations(prev => prev.map(s => s.id === id ? { ...s, status: 'confirmed' } : s));
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
    const role = (session?.user as any)?.role;
    if (status === 'unauthenticated' || (status === 'authenticated' && role !== 'admin' && role !== 'expert')) {
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
            <Button variant="outline" size="sm" className="bg-zinc-800 text-white border-zinc-700">Audit Logs</Button>
          </div>
        </div>

        <Tabs defaultValue={userRole === 'expert' ? 'consultations' : initialTab} className="w-full">
          <TabsList className="mb-12 flex flex-wrap gap-2 bg-zinc-900 border border-white/10 p-1 rounded-sm inline-flex">
            {userRole.includes('admin') && (
              <>
                <AdminTabTrigger value="inventory" icon={Package} label="Products" />
                <AdminTabTrigger value="orders" icon={Activity} label="Orders" />
                <AdminTabTrigger value="fabrication" icon={Hammer} label="Fabrication" />
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
                          <Input required type="number" step="0.01" className="bg-zinc-900 border-zinc-800" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Initial Logic Stock</label>
                          <Input required type="number" className="bg-zinc-900 border-zinc-800" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} />
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
                                  <Button variant="outline" size="sm" className="px-2 h-8 min-w-0">Edit</Button>
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
                        {/* ... table content ... */}
                        <thead>
                        <tr className="border-b border-white/10 bg-zinc-900/50">
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Registry ID</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Acquisition</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">Valuation</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest">State</th>
                          <th className="p-4 font-black uppercase text-[10px] text-zinc-500 tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order: any) => (
                          <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 text-xs font-mono text-safety-orange font-black underline cursor-pointer">{order.id}</td>
                            <td className="p-4 text-sm font-bold text-white uppercase tracking-tighter">{order.customer}</td>
                             <td className="p-4 text-sm font-black text-white">PHP {order.total.toFixed(2)}</td>
                            <td className="p-4">
                               <Badge variant={order.status === 'shipped' ? 'completed' : 'pending'}>{order.status.toUpperCase()}</Badge>
                            </td>
                            <td className="p-4 text-right">
                               {order.status === 'processing' ? (
                                 <Button variant="outline" size="sm" className="text-[10px] bg-green-600/10 text-green-500 border-green-500/20" onClick={() => shipOrder(order.id)}>Ship Package</Button>
                               ) : (
                                 <Button variant="outline" size="sm" className="text-[10px]" disabled>Receipt Sent</Button>
                               )}
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
              <TabsContent value="fabrication" className="mt-0">
                <div className="py-20 flex flex-col items-center border border-dashed border-white/10 rounded-sm bg-black/10">
                   <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center mb-6 rotate-45">
                       <Hammer className="w-8 h-8 text-zinc-700 -rotate-45" />
                   </div>
                   <h3 className="text-3xl font-black uppercase text-white tracking-tighter text-center">Manufacturing Control</h3>
                   <p className="text-zinc-500 mt-4 max-w-md text-center font-medium uppercase text-xs tracking-widest">Active Fabrication Jobs and System Status Monitoring.</p>
                   <Button className="mt-8 px-10 h-14 uppercase tracking-widest text-xs font-black bg-zinc-800 border border-white/10 hover:bg-safety-orange">Launch Fab Console</Button>
                </div>
              </TabsContent>
            </>
          )}

          {/* Consultation Management (For Admins and Experts) */}
          <TabsContent value="consultations" className="space-y-8 mt-0">
            <div className="mb-10">
               <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Session Control</h3>
               <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Manage technical consultations and design reviews</p>
            </div>

            {consultations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {consultations.map(session => (
                    <Card key={session.id} className="border border-white/5 bg-black/40">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                            <Badge variant="new" className="mb-2 uppercase">Session Protocol</Badge>
                            <h4 className="text-xl font-black text-white uppercase tracking-tight">{session.type}</h4>
                            <p className="text-xs text-zinc-500 font-medium">Client: {session.client}</p>
                        </div>
                        <Badge variant={session.status === 'confirmed' ? 'completed' : 'pending'}>
                          {session.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-sm mb-6 border border-white/5">
                          <Activity className="w-4 h-4 text-safety-orange" />
                          <span className="text-xs font-mono text-zinc-400 capitalize">{session.date}</span>
                      </div>

                      <div className="flex gap-4">
                          {session.status === 'pending' ? (
                            <Button className="flex-grow bg-green-600 hover:bg-green-700 uppercase font-black text-[10px]" onClick={() => confirmSession(session.id)}>Accept Session</Button>
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
