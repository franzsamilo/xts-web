"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ServiceQueue } from '@/components/fabrication/ServiceQueue';
import { Package, Settings, PenTool, LayoutDashboard, History, MessageCircle, User as UserIcon, ShoppingBag, LogOut, Mail, Shield, Activity, Truck, MapPin, Banknote, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role || 'member';
  const [activeTab, setActiveTab] = useState('overview');
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [userConsultations, setUserConsultations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [payBusyId, setPayBusyId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  // Tracks which order cards have their items dropdown expanded so the cards
  // stay uniform in height by default.
  const [expandedOrderItems, setExpandedOrderItems] = useState<Record<string, boolean>>({});

  const resumeGcashPayment = async (orderId: string) => {
    setPayBusyId(orderId);
    setPayError(null);
    try {
      const res = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setPayError(data.error || 'Could not open payment');
        return;
      }
      window.location.assign(data.checkoutUrl);
    } finally {
      setPayBusyId(null);
    }
  };

  const toggleOrderItems = (orderId: string) => {
    setExpandedOrderItems(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchUserData = async () => {
      try {
        const [ordRes, consultRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/consultations'),
        ]);
        if (ordRes.ok) setUserOrders(await ordRes.json());
        if (consultRes.ok) setUserConsultations(await consultRes.json());
      } catch (e) {
        console.error('Failed to fetch dashboard data', e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchUserData();
  }, [status]);

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="flex items-center gap-6 min-w-0">
            {session?.user?.image ? (
              <img src={session.user.image} alt="Profile" className="w-14 h-14 sm:w-20 sm:h-20 rounded-sm border-2 border-safety-orange p-1 shadow-2xl shrink-0" />
            ) : (
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-zinc-800 rounded-sm flex items-center justify-center border-2 border-safety-orange shadow-2xl shrink-0">
                <UserIcon className="w-10 h-10 text-white opacity-20" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge>ID: #{session?.user?.email?.split('@')[0].toUpperCase().slice(0, 7) || 'ENG-9902'}</Badge>
                <Badge variant="new" className="bg-safety-orange text-white">{userRole.toUpperCase()}</Badge>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                {session?.user?.name || 'Engineer'}
              </h2>
              <p className="font-handwriting text-safety-orange mt-1 break-all">Status: Operational // {session?.user?.email}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" className="flex gap-2" onClick={() => setActiveTab('account')}>
              <Settings className="w-4 h-4" /> Account
            </Button>
            {userRole.includes('admin') && (
              <Link href="/admin">
                <Button className="flex gap-2 bg-red-600 hover:bg-red-700 shadow-[0_4px_0_0_#991b1b]">
                  <LayoutDashboard className="w-4 h-4" /> Admin Terminal
                </Button>
              </Link>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-12">
            {/* Dashboard Nav */}
            <div className="space-y-2">
              <TabsList className="flex flex-row lg:flex-col h-auto bg-transparent p-0 gap-1 lg:gap-2 items-start overflow-x-auto pb-2 lg:pb-0">
                <TabsTrigger value="overview" className="group w-full p-0 bg-transparent data-[state=active]:bg-transparent border-none">
                   <DashboardTabContent icon={LayoutDashboard} label="Overview" />
                </TabsTrigger>
                <TabsTrigger value="orders" className="group w-full p-0 bg-transparent data-[state=active]:bg-transparent border-none">
                   <DashboardTabContent icon={ShoppingBag} label="Orders" />
                </TabsTrigger>
                <TabsTrigger value="fabrication" className="group w-full p-0 bg-transparent data-[state=active]:bg-transparent border-none">
                   <DashboardTabContent icon={PenTool} label="Fabrication Jobs" />
                </TabsTrigger>
                <TabsTrigger value="consultations" className="group w-full p-0 bg-transparent data-[state=active]:bg-transparent border-none">
                   <DashboardTabContent icon={MessageCircle} label="Consultations" />
                </TabsTrigger>
                <TabsTrigger value="activity" className="group w-full p-0 bg-transparent data-[state=active]:bg-transparent border-none">
                   <DashboardTabContent icon={History} label="Activity Log" />
                </TabsTrigger>
                <TabsTrigger value="account" className="group w-full p-0 bg-transparent data-[state=active]:bg-transparent border-none">
                   <DashboardTabContent icon={Settings} label="Account" />
                </TabsTrigger>
                
                <div className="pt-8 pb-4">
                  <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest px-6 italic">Specialist Access</span>
                </div>
                
                {userRole === 'member' && (
                  <TabsTrigger value="applications" className="group w-full p-0 bg-transparent data-[state=active]:bg-transparent border-none">
                    <DashboardTabContent icon={UserIcon} label="Become a Specialist" />
                  </TabsTrigger>
                )}
                
                {userRole.includes('admin') && (
                  <button 
                    onClick={() => window.location.href='/admin?tab=inventory'}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-sm transition-all font-bold uppercase text-xs tracking-tighter text-left text-zinc-500 hover:bg-zinc-800/50 hover:text-white"
                  >
                    <Package className="w-4 h-4" /> Store Management
                  </button>
                )}
                
                {(userRole.includes('admin') || userRole.includes('expert')) && (
                  <button 
                    onClick={() => window.location.href='/admin?tab=consultations'}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-sm transition-all font-bold uppercase text-xs tracking-tighter text-left text-zinc-500 hover:bg-zinc-800/50 hover:text-white"
                  >
                    <MessageCircle className="w-4 h-4" /> Consultant Portal
                  </button>
                )}
              </TabsList>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <TabsContent value="overview" className="space-y-12 mt-0">
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <StatCard label="Completed Orders" value={String(userOrders.filter(o => o.status === 'delivered').length)} sub={userOrders.length > 0 ? `${userOrders.length} total` : 'No orders yet'} />
                  <StatCard label="Active Projects" value="—" sub="Via fabrication queue" />
                  <StatCard label="Consultations" value={String(userConsultations.length)} sub={userConsultations.length > 0 ? `${userConsultations.filter(c => c.status === 'confirmed').length} confirmed` : 'No sessions booked'} />
                </div>

                {/* Active Fabrication */}
                <div>
                  <h3 className="text-xl font-black uppercase text-white mb-8 flex items-center gap-3">
                    <PenTool className="w-5 h-5 text-safety-orange" />
                    Active Fab Jobs
                  </h3>
                  <ServiceQueue autoFetch={true} />
                </div>

                {/* Recent Shop Orders */}
                <div>
                  <h3 className="text-xl font-black uppercase text-white mb-8 flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-safety-orange" />
                    Recent Shop Orders
                  </h3>
                  <div className="space-y-4">
                    {userOrders.length > 0 ? (
                      userOrders.slice(0, 5).map(order => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          expanded={!!expandedOrderItems[order.id]}
                          onToggleItems={() => toggleOrderItems(order.id)}
                          payBusyId={payBusyId}
                          payError={payError}
                          onResumePayment={resumeGcashPayment}
                        />
                      ))
                    ) : (
                      <div className="py-12 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                          <Package className="w-6 h-6 text-zinc-600" />
                        </div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-1">No Orders Logged</h4>
                        <p className="text-xs text-zinc-500 max-w-xs mb-6 font-medium">Your account hasn&apos;t processed any hardware acquisitions yet.</p>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = '/shop'}>Visit Shop</Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="mt-0">
                <SectionHeader title="Order History" description="Manage your hardware acquisitions and tracking." />
                {loadingData ? (
                  <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
                ) : userOrders.length > 0 ? (
                  <div className="space-y-4">
                    {userOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        expanded={!!expandedOrderItems[order.id]}
                        onToggleItems={() => toggleOrderItems(order.id)}
                        payBusyId={payBusyId}
                        payError={payError}
                        onResumePayment={resumeGcashPayment}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={ShoppingBag} title="No Orders" description="You haven't placed any orders yet." actionLabel="Go to Shop" actionHref="/shop" />
                )}
              </TabsContent>

              <TabsContent value="fabrication" className="mt-0">
                <SectionHeader title="Fabrication Queue" description="Track your custom parts and manufacturing jobs." />
                <ServiceQueue autoFetch={true} />
              </TabsContent>

              <TabsContent value="consultations" className="mt-0">
                <SectionHeader title="My Consultations" description="View upcoming meetings and saved engineering notes." />
                {loadingData ? (
                  <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
                ) : userConsultations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userConsultations.map((c: any) => (
                      <Card key={c.id} className="border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-black text-esd-dark uppercase">{c.expertName}</h4>
                            <p className="text-xs text-[var(--text-on-card-muted)]">{c.expertTitle}</p>
                          </div>
                          <Badge variant={
                            c.status === 'completed' ? 'completed'
                            : c.status === 'confirmed' ? 'confirmed'
                            : c.status === 'cancelled' ? 'cancelled'
                            : 'pending'
                          }>{(c.status || 'pending').toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-zinc-100 rounded-sm">
                          <Activity className="w-4 h-4 text-safety-orange" />
                          <span className="text-xs font-mono text-[var(--text-on-card-secondary)]">{c.slot || 'TBD'} — {c.expertPrice}</span>
                        </div>

                        <Link
                          href={`/chat?tab=consultations&id=${c.id}&source=consultation`}
                          className="mt-3 w-full block"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[10px] uppercase font-black"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Chat with Expert
                          </Button>
                        </Link>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={MessageCircle} title="No Sessions" description="Connect with an expert to start your first session." actionLabel="Find an Expert" actionHref="/consultation" />
                )}
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <SectionHeader title="System Log" description="A technical log of your account activity." />
                <div className="font-mono text-[10px] text-zinc-500 bg-black/50 p-6 border border-white/5 rounded-sm">
                  <p className="text-green-500 mb-2">[SUCCESS] SESSION_INITIALIZED at {new Date().toISOString()}</p>
                  <p className="mb-2">[INFO] USER_ROLE: {userRole.toUpperCase()}</p>
                  <p>[INFO] SYSTEM_VERSION: 1.0.4-STABLE</p>
                </div>
              </TabsContent>

              <TabsContent value="applications" className="mt-0 space-y-8">
                <SectionHeader title="Expert Verification" description="Apply to become a verified engineering consultant on the XTS Platform." />
                <div className="grid grid-cols-1 max-w-2xl gap-8">
                  <Card className="border-2 border-transparent hover:border-safety-orange transition-all cursor-pointer group" onClick={() => window.location.href='/apply/expert'}>
                    <div className="flex gap-6 p-4">
                       <div className="w-16 h-16 bg-zinc-900 rounded-sm flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-safety-orange group-hover:scale-110 transition-all duration-300">
                         <PenTool className="w-8 h-8 text-zinc-500 group-hover:text-white" />
                       </div>
                       <div>
                         <h4 className="text-xl font-black text-esd-dark uppercase mb-2">Become an Expert</h4>
                         <p className="text-xs text-[var(--text-on-card-secondary)] leading-relaxed font-medium">Offer technical consultations, design reviews, and engineering advice to the community. Get paid for your expertise.</p>
                       </div>
                    </div>
                  </Card>

                  <Card className="border-2 border-transparent hover:border-blue-600 transition-all cursor-pointer group" onClick={() => window.location.href='/apply/seller'}>
                    <div className="flex gap-6 p-4">
                       <div className="w-16 h-16 bg-zinc-900 rounded-sm flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
                         <ShoppingBag className="w-8 h-8 text-zinc-500 group-hover:text-white" />
                       </div>
                       <div>
                         <h4 className="text-xl font-black text-esd-dark uppercase mb-2">Register as Vendor</h4>
                         <p className="text-xs text-[var(--text-on-card-secondary)] leading-relaxed font-medium">List your hardware, components, and tools on the XTS marketplace. Reach thousands of engineers.</p>
                       </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="account" className="mt-0 space-y-8">
                <SectionHeader title="Account Settings" description="Manage your profile and preferences." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border border-white/5 bg-black/20">
                    <div className="flex items-center gap-6 mb-8">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt="Profile" className="w-16 h-16 rounded-sm border-2 border-safety-orange" />
                      ) : (
                        <div className="w-16 h-16 bg-zinc-800 rounded-sm flex items-center justify-center border border-white/10">
                          <UserIcon className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter">{session?.user?.name || 'User'}</h4>
                        <p className="text-xs text-zinc-500 font-mono">{session?.user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-sm border border-white/5">
                        <Mail className="w-4 h-4 text-zinc-500" />
                        <div>
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block">Email</span>
                          <span className="text-sm text-white font-medium">{session?.user?.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-sm border border-white/5">
                        <Shield className="w-4 h-4 text-zinc-500" />
                        <div>
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block">Role</span>
                          <span className="text-sm text-safety-orange font-bold uppercase">{userRole}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-6">
                    <Card className="border border-white/5 bg-black/20">
                      <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-4">Session</h4>
                      <p className="text-xs text-zinc-500 mb-6">Auth via Google OAuth. Session managed by NextAuth JWT.</p>
                      <Button 
                        variant="danger" 
                        className="w-full flex items-center justify-center gap-2" 
                        onClick={() => signOut({ callbackUrl: '/' })}
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </Button>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </PageShell>
  );
}

const SectionHeader = ({ title, description }: { title: string, description: string }) => (
  <div className="mb-12">
    <h3 className="text-3xl font-black uppercase text-white mb-2 tracking-tighter">{title}</h3>
    <p className="text-zinc-500 font-medium text-sm">{description}</p>
    <div className="h-1 w-20 bg-safety-orange mt-6" />
  </div>
);

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionHref }: any) => (
  <div className="py-24 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center mb-6">
      <Icon className="w-8 h-8 text-zinc-700" />
    </div>
    <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{title}</h4>
    <p className="text-sm text-zinc-500 max-w-sm mb-8 font-medium">{description}</p>
    <Button onClick={() => window.location.href = actionHref}>{actionLabel}</Button>
  </div>
);

const DashboardTabContent = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="w-full flex items-center gap-4 px-6 py-4 rounded-sm transition-all font-bold uppercase text-xs tracking-tighter text-left text-zinc-500 hover:bg-zinc-800/50 hover:text-white group-data-[state=active]:bg-safety-orange group-data-[state=active]:text-white group-data-[state=active]:shadow-lg">
    <Icon className="w-4 h-4" />
    {label}
  </div>
);

const StatCard = ({ label, value, sub }: { label: string, value: string, sub: string }) => (
  <div className="p-8 bg-zinc-900 border border-white/5 rounded-sm shadow-2xl relative overflow-hidden group">
     <div className="absolute top-0 left-0 w-1 h-full bg-safety-orange opacity-0 group-hover:opacity-100 transition-opacity" />
     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">{label}</span>
     <h4 className="text-4xl font-black text-white mb-2">{value}</h4>
     <p className="text-xs font-handwriting text-safety-orange opacity-80">{sub}</p>
  </div>
);

interface OrderCardProps {
  order: any;
  expanded: boolean;
  onToggleItems: () => void;
  payBusyId: string | null;
  payError: string | null;
  onResumePayment: (orderId: string) => void;
}

// Uniform-height order card. The items list is hidden behind a dropdown so a
// 1-item order takes the same vertical space as a 10-item order. Without this
// the cards in the orders list look ragged because each grows with item count.
const OrderCard = ({ order, expanded, onToggleItems, payBusyId, payError, onResumePayment }: OrderCardProps) => {
  const items = order.items || [];
  const itemCount = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0 flex-grow">
          <span className="text-xs font-black text-[var(--text-on-card-muted)] uppercase tracking-widest">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
          </span>
          <h4 className="text-xl font-bold text-esd-dark mt-1">#{order.id?.slice(0, 8).toUpperCase()}</h4>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {order.deliveryMethod && (
              <div className="flex items-center gap-1.5">
                {order.deliveryMethod === 'pickup' ? (
                  <><MapPin className="w-3 h-3 text-blue-500" /><span className="text-[10px] text-blue-400 font-bold uppercase">Pickup: {order.pickupPointName || 'Local'}</span></>
                ) : (
                  <><Truck className="w-3 h-3 text-safety-orange" /><span className="text-[10px] text-[var(--text-on-card-muted)] font-bold uppercase">Standard Delivery</span></>
                )}
              </div>
            )}
            {order.paymentMethod && (
              <div className="flex items-center gap-1.5">
                {order.paymentMethod === 'gcash' ? (
                  <><CreditCard className="w-3 h-3 text-blue-400" /><span className="text-[10px] text-blue-400 font-bold uppercase">GCash</span></>
                ) : (
                  <><Banknote className="w-3 h-3 text-green-500" /><span className="text-[10px] text-green-500 font-bold uppercase">COD</span></>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black text-esd-dark">PHP {(order.total || 0).toFixed(2)}</p>
          <Badge variant={order.status === 'delivered' ? 'completed' : order.status === 'shipped' ? 'in-progress' : 'pending'}>{(order.status || 'processing').toUpperCase()}</Badge>
          {order.paymentStatus === 'awaiting_gateway' && order.paymentMethod === 'gcash' && (
            <p className="text-[10px] text-amber-400 font-bold mt-1">Awaiting GCash payment</p>
          )}
          {order.paymentStatus === 'awaiting_gateway' && order.paymentMethod === 'gcash' && order.id && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                disabled={payBusyId === order.id}
                onClick={() => onResumePayment(order.id)}
              >
                {payBusyId === order.id ? 'Opening…' : 'Complete GCash payment'}
              </Button>
              {payError && payBusyId === null && (
                <p className="text-[10px] text-red-400 font-bold mt-2 max-w-[18rem]">{payError}</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--border-secondary)] pt-3">
        <button
          type="button"
          onClick={onToggleItems}
          className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-on-card-muted)] hover:text-esd-dark transition-colors"
          aria-expanded={expanded}
        >
          <span>
            {items.length} {items.length === 1 ? 'item' : 'item types'} · {itemCount} unit{itemCount === 1 ? '' : 's'}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {expanded && (
          <ul className="mt-3 space-y-1.5">
            {items.map((item: any, i: number) => (
              <li key={i} className="flex items-center justify-between text-xs text-[var(--text-on-card-secondary)]">
                <span className="truncate pr-2">{item.name} <span className="text-[var(--text-on-card-muted)]">×{item.quantity}</span></span>
                <span className="font-mono text-[var(--text-on-card-muted)] shrink-0">PHP {(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};
