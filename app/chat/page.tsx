"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { MessageCircle, Send, ArrowLeft, Package, Activity, User as UserIcon, Trash2, ExternalLink } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Suspense } from 'react';

interface Chat {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  productRef?: { id: string; name: string; price: number; imageUrl?: string };
  pickupRef?: { pointId: string; pointName: string; pointAddress: string };
  lastMessage?: string;
  lastMessageAt?: string;
  hasUnread?: boolean;
  type: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
}

function ChatPageInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const chatIdParam = searchParams.get('id');
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; chatId: string | null }>({ open: false, chatId: null });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userEmail = session?.user?.email || '';

  useEffect(() => {
    fetchChats();
  }, []);

  // Auto-open chat when ?id= param is present
  useEffect(() => {
    if (chatIdParam && chats.length > 0 && !selectedChat) {
      const target = chats.find(c => c.id === chatIdParam);
      if (target) openChat(target);
    }
  }, [chatIdParam, chats]);

  // Poll for new messages every 5 seconds when a chat is open
  useEffect(() => {
    if (!selectedChat) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/${selectedChat.id}`);
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
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) setChats(await res.json());
    } catch (e) {
      console.error('Failed to fetch chats', e);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, hasUnread: false } : c));
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chats/${chat.id}`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (e) {
      console.error('Failed to fetch messages', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}`, {
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
      }
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (selectedChat?.id === chatId) {
          setSelectedChat(null);
          setMessages([]);
        }
        setDeleteConfirm({ open: false, chatId: null });
      }
    } catch (e) {
      console.error('Failed to delete chat', e);
    }
  };

  const getOtherName = (chat: Chat) => {
    const other = chat.participants.find(p => p !== userEmail);
    return other ? (chat.participantNames[other] || other) : 'Unknown';
  };

  // Check if a message content is a product inquiry (starts with "Hi! I'm interested")
  const isProductInquiry = (content: string) => {
    return content.startsWith("Hi! I'm interested in this product:");
  };

  // Render product inquiry as a styled card
  const renderProductCard = (msg: Message, chat: Chat | null, isMe: boolean) => {
    const productRef = chat?.productRef;
    return (
      <div className={`max-w-[80%] rounded-sm overflow-hidden ${isMe ? 'bg-safety-orange' : 'bg-[var(--bg-surface)] border border-[var(--border-primary)]'}`}>
        {/* Product preview header */}
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
        {/* Message body */}
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

  return (
    <PageShell>
      <div className="container mx-auto px-4 pt-16 sm:pt-20 pb-4 flex flex-col h-[calc(100vh-64px)]">
        <SectionHeading title="Messages" annotation="Chat & Support" dark={true} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Chat List — scrollable, contained */}
          <div className={`flex flex-col h-full overflow-hidden border border-[var(--border-primary)] rounded-sm bg-[var(--bg-secondary)] ${selectedChat ? 'hidden lg:flex' : ''}`}>
            <div className="p-3 border-b border-[var(--border-primary)] bg-[var(--bg-surface)]">
              <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                Conversations ({chats.length})
              </h4>
            </div>
            <div className="flex-grow overflow-y-auto">
              {loading ? (
                <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
              ) : chats.length > 0 ? (
                <div className="divide-y divide-[var(--border-secondary)]">
                  {chats.map(chat => (
                    <div
                      key={chat.id}
                      className={`relative group cursor-pointer transition-all ${
                        selectedChat?.id === chat.id
                          ? 'bg-safety-orange/10 border-l-2 border-l-safety-orange'
                          : 'hover:bg-[var(--bg-surface)] border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="p-3" onClick={() => openChat(chat)}>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-9 h-9 rounded-full bg-safety-orange/20 flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 text-safety-orange" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className={`text-sm font-bold text-[var(--text-primary)] truncate ${chat.hasUnread ? 'font-black' : ''}`}>{getOtherName(chat)}</h4>
                            <p className={`text-[10px] truncate ${chat.hasUnread ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)]'}`}>{chat.lastMessage || 'No messages yet'}</p>
                          </div>
                          {chat.hasUnread && (
                            <span className="w-2.5 h-2.5 bg-safety-orange rounded-full shrink-0 animate-pulse" />
                          )}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant={chat.type === 'product' ? 'new' : chat.type === 'consultation' ? 'in-progress' : 'pending'} className="text-[7px]">
                              {chat.type}
                            </Badge>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, chatId: chat.id }); }}
                              className="p-1 rounded-sm text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {chat.productRef && (
                          <div className="ml-12 flex items-center gap-2 mt-1 px-2 py-1 bg-[var(--bg-surface-elevated)] rounded-sm border border-[var(--border-secondary)]">
                            {chat.productRef.imageUrl ? (
                              <img src={chat.productRef.imageUrl} alt="" className="w-4 h-4 rounded-sm object-cover" />
                            ) : (
                              <Package className="w-3 h-3 text-safety-orange shrink-0" />
                            )}
                            <span className="text-[9px] font-bold text-[var(--text-secondary)] truncate">{chat.productRef.name}</span>
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
                  <p className="text-xs text-[var(--text-muted)]">Start a chat from a product page or consultation.</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 h-full overflow-hidden">
            {selectedChat ? (
              <div className="flex flex-col h-full border border-[var(--border-primary)] rounded-sm overflow-hidden bg-[var(--bg-secondary)]">
                {/* Chat Header */}
                <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-surface)] flex items-center gap-3 shrink-0">
                  <button onClick={() => setSelectedChat(null)} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-safety-orange/20 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-safety-orange" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">{getOtherName(selectedChat)}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">{selectedChat.type} chat</p>
                  </div>
                  {selectedChat.productRef && (
                    <Link
                      href={`/shop/${selectedChat.productRef.id}`}
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-safety-orange/10 rounded-sm border border-safety-orange/20 hover:bg-safety-orange/20 transition-colors"
                    >
                      {selectedChat.productRef.imageUrl ? (
                        <img src={selectedChat.productRef.imageUrl} alt="" className="w-5 h-5 rounded-sm object-cover" />
                      ) : (
                        <Package className="w-3 h-3 text-safety-orange" />
                      )}
                      <span className="text-[10px] font-bold text-safety-orange">{selectedChat.productRef.name}</span>
                    </Link>
                  )}
                </div>

                {/* Messages */}
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
                            renderProductCard(msg, selectedChat, isMe)
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
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
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
