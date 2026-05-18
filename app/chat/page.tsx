"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { MessageCircle, Send, ArrowLeft, Package, Activity, User as UserIcon, Trash2, ExternalLink, ShoppingBag, PenTool } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';

type ConversationSource = 'chat' | 'consultation';

interface Conversation {
  id: string;
  source: ConversationSource;
  participants: string[];
  participantNames: Record<string, string>;
  productRef?: { id: string; name: string; price: number; imageUrl?: string };
  pickupRef?: { pointId: string; pointName: string; pointAddress: string };
  lastMessage?: string;
  lastMessageAt?: string;
  hasUnread?: boolean;
  type: string;
  /** Consultation-only metadata, present when source==='consultation'. */
  consultation?: {
    expertName: string;
    expertTitle: string;
    expertPrice: string;
    slot: string;
    status: string;
  };
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
}

type TabKey = 'orders' | 'consultations';

function ChatPageInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatIdParam = searchParams.get('id');
  const tabParam = searchParams.get('tab');
  const sourceParam = searchParams.get('source') as ConversationSource | null;

  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam === 'consultations' ? 'consultations' : 'orders'
  );
  const [chats, setChats] = useState<Conversation[]>([]);
  const [consultations, setConsultations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; chatId: string | null }>({ open: false, chatId: null });
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userEmail = session?.user?.email || '';

  const visibleList = activeTab === 'consultations' ? consultations : chats;

  useEffect(() => {
    fetchAll();
    // Sync nav badge whenever we load this page.
    window.dispatchEvent(new Event('chats:refresh-unread'));
  }, []);

  // Auto-open conversation when ?id= param is present
  useEffect(() => {
    if (!chatIdParam || (chats.length === 0 && consultations.length === 0) || selected) return;
    // If source is explicit, only search that pool; otherwise search both.
    const pool =
      sourceParam === 'consultation'
        ? consultations
        : sourceParam === 'chat'
          ? chats
          : [...consultations, ...chats];
    const target = pool.find(c => c.id === chatIdParam);
    if (target) {
      // Switch to the appropriate tab so the user sees the highlighted row.
      setActiveTab(target.source === 'consultation' ? 'consultations' : 'orders');
      openConversation(target);
    }
  }, [chatIdParam, sourceParam, chats, consultations]);

  // Poll for new messages every 5 seconds when a conversation is open
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(async () => {
      try {
        const url = selected.source === 'consultation'
          ? `/api/consultations/${selected.id}/messages`
          : `/api/chats/${selected.id}`;
        const res = await fetch(url);
        if (res.ok) {
          const msgs = await res.json();
          setMessages(prev => {
            if (msgs.length !== prev.length) {
              setTimeout(() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
              }, 100);
              return msgs;
            }
            return prev;
          });
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [selected]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [chatRes, consultRes] = await Promise.all([
        fetch('/api/chats'),
        fetch('/api/consultations'),
      ]);
      if (chatRes.ok) {
        const data = (await chatRes.json()) as Conversation[];
        setChats((data || []).map((c) => ({ ...c, source: 'chat' as const })));
      }
      if (consultRes.ok) {
        type ConsultationApi = {
          id: string;
          clientEmail: string;
          clientName?: string;
          lastMessage?: string;
          lastMessageAt?: string;
          hasUnread?: boolean;
          expertName?: string;
          expertTitle?: string;
          expertPrice?: string;
          slot?: string;
          status?: string;
        };
        const data = (await consultRes.json()) as ConsultationApi[];
        setConsultations(
          (data || []).map((c) => ({
            id: c.id,
            source: 'consultation' as const,
            participants: [c.clientEmail],
            participantNames: { [c.clientEmail]: c.clientName || c.clientEmail },
            lastMessage: c.lastMessage,
            lastMessageAt: c.lastMessageAt,
            hasUnread: !!c.hasUnread,
            type: 'consultation',
            consultation: {
              expertName: c.expertName || 'Pending Assignment',
              expertTitle: c.expertTitle || '',
              expertPrice: c.expertPrice || 'TBD',
              slot: c.slot || 'TBD',
              status: c.status || 'pending',
            },
          }))
        );
      }
    } catch (e) {
      console.error('Failed to fetch conversations', e);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (convo: Conversation) => {
    setSelected(convo);
    if (convo.source === 'consultation') {
      setConsultations(prev => prev.map(c => c.id === convo.id ? { ...c, hasUnread: false } : c));
    } else {
      setChats(prev => prev.map(c => c.id === convo.id ? { ...c, hasUnread: false } : c));
    }
    setLoadingMessages(true);
    try {
      const url = convo.source === 'consultation'
        ? `/api/consultations/${convo.id}/messages`
        : `/api/chats/${convo.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      }
      // Nudge the navbar to reflect the just-cleared unread state.
      window.dispatchEvent(new Event('chats:refresh-unread'));
    } catch (e) {
      console.error('Failed to fetch messages', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selected) return;
    setSending(true);
    try {
      const url = selected.source === 'consultation'
        ? `/api/consultations/${selected.id}/messages`
        : `/api/chats/${selected.id}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, { ...msg, createdAt: new Date().toISOString() }]);
        setNewMessage('');
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
        window.dispatchEvent(new Event('chats:refresh-unread'));
      }
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    // Only chats (not consultations) are soft-deletable from this UI.
    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (selected?.id === chatId) {
          setSelected(null);
          setMessages([]);
        }
        setDeleteConfirm({ open: false, chatId: null });
      }
    } catch (e) {
      console.error('Failed to delete chat', e);
    }
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSelected(null);
    setMessages([]);
    // Reflect the tab in the URL without a full navigation so refreshes land
    // back where the user was.
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('id');
    params.delete('source');
    router.replace(`/chat?${params.toString()}`);
  };

  const getOtherName = (convo: Conversation) => {
    if (convo.source === 'consultation') {
      return convo.consultation?.expertName || 'Pending Assignment';
    }
    const other = convo.participants.find(p => p !== userEmail);
    return other ? (convo.participantNames[other] || other) : 'Unknown';
  };

  const isProductInquiry = (content: string) =>
    content.startsWith("Hi! I'm interested in this product:");

  const renderProductCard = (msg: Message, convo: Conversation | null, isMe: boolean) => {
    const productRef = convo?.productRef;
    return (
      <div className={`max-w-[80%] rounded-sm overflow-hidden ${isMe ? 'bg-safety-orange' : 'bg-[var(--bg-surface)] border border-[var(--border-primary)]'}`}>
        {productRef && (
          <div className={`flex items-center gap-3 p-3 ${isMe ? 'bg-black/10' : 'bg-[var(--bg-surface-elevated)]'} border-b ${isMe ? 'border-white/10' : 'border-[var(--border-secondary)]'}`}>
            {productRef.imageUrl ? (
              <img src={productRef.imageUrl} alt={productRef.name} className="w-14 h-14 rounded-sm object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-sm bg-black/10 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 opacity-40" />
              </div>
            )}
            <div className="flex-grow min-w-0">
              <p className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-[var(--text-primary)]'}`}>{productRef.name}</p>
              <p className={`text-lg font-black ${isMe ? 'text-white' : 'text-safety-orange'}`}>₱{productRef.price?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
            <Link href={`/shop/${productRef.id}`} className={`shrink-0 p-1.5 rounded-sm ${isMe ? 'hover:bg-white/10' : 'hover:bg-[var(--border-secondary)]'} transition-colors`}>
              <ExternalLink className={`w-4 h-4 ${isMe ? 'text-white/60' : 'text-[var(--text-muted)]'}`} />
            </Link>
          </div>
        )}
        <div className="px-4 py-3">
          <p className={`text-sm ${isMe ? 'text-white' : 'text-[var(--text-primary)]'}`}>
            Hi! I&apos;m interested in this product. Could you help me with more details?
          </p>
          <p className={`text-[10px] mt-2 ${isMe ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>
            {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  const tabCounts = useMemo(() => ({
    orders: chats.filter(c => c.hasUnread).length,
    consultations: consultations.filter(c => c.hasUnread).length,
  }), [chats, consultations]);

  return (
    <PageShell>
      <div className="container mx-auto px-4 pt-16 sm:pt-20 pb-4 flex flex-col h-[calc(100vh-64px)]">
        <SectionHeading title="Messages" annotation="Chat & Support" dark={true} />

        {/* Tabs: Orders vs Consultations */}
        <div className="flex gap-2 mb-4 border-b border-[var(--border-primary)]">
          <TabButton
            active={activeTab === 'orders'}
            onClick={() => handleTabChange('orders')}
            icon={ShoppingBag}
            label="Orders"
            count={chats.length}
            unread={tabCounts.orders}
          />
          <TabButton
            active={activeTab === 'consultations'}
            onClick={() => handleTabChange('consultations')}
            icon={PenTool}
            label="Consultations"
            count={consultations.length}
            unread={tabCounts.consultations}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Conversation List */}
          <div className={`flex flex-col h-full overflow-hidden border border-[var(--border-primary)] rounded-sm bg-[var(--bg-secondary)] ${selected ? 'hidden lg:flex' : ''}`}>
            <div className="p-3 border-b border-[var(--border-primary)] bg-[var(--bg-surface)]">
              <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                {activeTab === 'consultations' ? 'Expert Conversations' : 'Conversations'} ({visibleList.length})
              </h4>
            </div>
            <div className="flex-grow overflow-y-auto">
              {loading ? (
                <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
              ) : visibleList.length > 0 ? (
                <div className="divide-y divide-[var(--border-secondary)]">
                  {visibleList.map(convo => (
                    <div
                      key={`${convo.source}-${convo.id}`}
                      className={`relative group cursor-pointer transition-all ${
                        selected?.id === convo.id && selected?.source === convo.source
                          ? 'bg-safety-orange/10 border-l-2 border-l-safety-orange'
                          : 'hover:bg-[var(--bg-surface)] border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="p-3" onClick={() => openConversation(convo)}>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-9 h-9 rounded-full bg-safety-orange/20 flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 text-safety-orange" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className={`text-sm font-bold text-[var(--text-primary)] truncate ${convo.hasUnread ? 'font-black' : ''}`}>{getOtherName(convo)}</h4>
                            <p className={`text-[10px] truncate ${convo.hasUnread ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)]'}`}>{convo.lastMessage || (convo.source === 'consultation' ? convo.consultation?.expertTitle : 'No messages yet')}</p>
                          </div>
                          {convo.hasUnread && (
                            <span className="w-2.5 h-2.5 bg-safety-orange rounded-full shrink-0 animate-pulse" />
                          )}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant={convo.type === 'product' ? 'new' : convo.type === 'consultation' ? 'in-progress' : 'pending'} className="text-[7px]">
                              {convo.type}
                            </Badge>
                            {convo.source === 'chat' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, chatId: convo.id }); }}
                                className="p-1 rounded-sm text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                                title="Delete chat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {convo.productRef && (
                          <div className="ml-12 flex items-center gap-2 mt-1 px-2 py-1 bg-[var(--bg-surface-elevated)] rounded-sm border border-[var(--border-secondary)]">
                            {convo.productRef.imageUrl ? (
                              <img src={convo.productRef.imageUrl} alt="" className="w-4 h-4 rounded-sm object-cover" />
                            ) : (
                              <Package className="w-3 h-3 text-safety-orange shrink-0" />
                            )}
                            <span className="text-[9px] font-bold text-[var(--text-secondary)] truncate">{convo.productRef.name}</span>
                          </div>
                        )}
                        {convo.source === 'consultation' && convo.consultation && (
                          <div className="ml-12 flex items-center gap-2 mt-1 px-2 py-1 bg-[var(--bg-surface-elevated)] rounded-sm border border-[var(--border-secondary)]">
                            <PenTool className="w-3 h-3 text-safety-orange shrink-0" />
                            <span className="text-[9px] font-bold text-[var(--text-secondary)] truncate">{convo.consultation.expertTitle || 'Consultation'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center text-center px-4">
                  <MessageCircle className="w-12 h-12 text-[var(--text-muted)] mb-4" />
                  <h4 className="text-lg font-black text-[var(--text-primary)] uppercase mb-2">No Conversations</h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    {activeTab === 'consultations'
                      ? 'Book a consultation to chat with an expert.'
                      : 'Start a chat from a product page or pickup point.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Window */}
          <div className="lg:col-span-2 h-full overflow-hidden">
            {selected ? (
              <div className="flex flex-col h-full border border-[var(--border-primary)] rounded-sm overflow-hidden bg-[var(--bg-secondary)]">
                <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-surface)] flex items-center gap-3 shrink-0">
                  <button onClick={() => setSelected(null)} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-safety-orange/20 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-safety-orange" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">{getOtherName(selected)}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest truncate">
                      {selected.source === 'consultation'
                        ? `${selected.consultation?.expertTitle || ''} · ${selected.consultation?.slot || ''}`
                        : `${selected.type} chat`}
                    </p>
                  </div>
                  {selected.productRef && (
                    <Link
                      href={`/shop/${selected.productRef.id}`}
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-safety-orange/10 rounded-sm border border-safety-orange/20 hover:bg-safety-orange/20 transition-colors"
                    >
                      {selected.productRef.imageUrl ? (
                        <img src={selected.productRef.imageUrl} alt="" className="w-5 h-5 rounded-sm object-cover" />
                      ) : (
                        <Package className="w-3 h-3 text-safety-orange" />
                      )}
                      <span className="text-[10px] font-bold text-safety-orange">{selected.productRef.name}</span>
                    </Link>
                  )}
                  {selected.source === 'consultation' && selected.consultation && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-safety-orange/10 rounded-sm border border-safety-orange/20">
                      <Badge variant={
                        selected.consultation.status === 'completed' ? 'completed'
                        : selected.consultation.status === 'confirmed' ? 'confirmed'
                        : selected.consultation.status === 'cancelled' ? 'cancelled'
                        : 'pending'
                      } className="text-[8px]">
                        {selected.consultation.status.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>

                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {loadingMessages ? (
                    <div className="py-10 flex justify-center"><Activity className="w-6 h-6 text-safety-orange animate-spin" /></div>
                  ) : messages.length > 0 ? (
                    messages.map(msg => {
                      const isMe = msg.senderId === userEmail;
                      const isInquiry = isProductInquiry(msg.content);
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {isInquiry ? (
                            renderProductCard(msg, selected, isMe)
                          ) : (
                            <div className={`max-w-[75%] px-4 py-3 rounded-sm ${
                              isMe
                                ? 'bg-safety-orange text-white'
                                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>
                                {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-[var(--text-muted)] text-sm">No messages yet. Say hello!</p>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-surface)] shrink-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      className="flex-grow h-10 text-sm bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-on-input)]"
                    />
                    <Button
                      size="sm"
                      className="px-4 h-10"
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center h-full border border-[var(--border-primary)] rounded-sm bg-[var(--bg-surface)]">
                <MessageCircle className="w-16 h-16 text-[var(--text-muted)] mb-4" />
                <h4 className="text-xl font-black text-[var(--text-primary)] uppercase mb-2">Select a Conversation</h4>
                <p className="text-sm text-[var(--text-muted)]">Choose a chat from the sidebar to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirm.open}
        title="Delete Conversation"
        message="This conversation will be hidden from your view. The other participant can still see it."
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={() => deleteConfirm.chatId && handleDeleteChat(deleteConfirm.chatId)}
        onCancel={() => setDeleteConfirm({ open: false, chatId: null })}
      />
    </PageShell>
  );
}

const TabButton = ({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  unread,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  unread: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px',
      active
        ? 'border-safety-orange text-safety-orange'
        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
    <span className="text-[10px] opacity-60">({count})</span>
    {unread > 0 && (
      <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-safety-orange text-white text-[9px] font-black">
        {unread > 9 ? '9+' : unread}
      </span>
    )}
  </button>
);

export default function ChatPage() {
  return (
    <Suspense fallback={
      <PageShell>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[50vh]">
          <div className="font-mono text-safety-orange animate-pulse uppercase tracking-widest">Loading Messages...</div>
        </div>
      </PageShell>
    }>
      <ChatPageInner />
    </Suspense>
  );
}
