"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { MessageCircle, Send, ArrowLeft, Package, Activity, User as UserIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

interface Chat {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  productRef?: { id: string; name: string; price: number; imageUrl?: string };
  lastMessage?: string;
  lastMessageAt?: string;
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

export default function ChatPage() {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userEmail = session?.user?.email || '';

  useEffect(() => {
    fetchChats();
  }, []);

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
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chats/${chat.id}`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSending(false);
    }
  };

  const getOtherName = (chat: Chat) => {
    const other = chat.participants.find(p => p !== userEmail);
    return other ? (chat.participantNames[other] || other) : 'Unknown';
  };

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <SectionHeading title="Messages" annotation="Chat & Support" dark={true} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[60vh]">
          {/* Chat List */}
          <div className={`space-y-3 ${selectedChat ? 'hidden lg:block' : ''}`}>
            {loading ? (
              <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
            ) : chats.length > 0 ? (
              chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={`p-4 rounded-sm border cursor-pointer transition-all ${
                    selectedChat?.id === chat.id
                      ? 'border-safety-orange bg-safety-orange/5'
                      : 'border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-safety-orange/20 flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-safety-orange" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{getOtherName(chat)}</h4>
                      <p className="text-xs text-[var(--text-muted)] truncate">{chat.lastMessage || 'No messages yet'}</p>
                    </div>
                    <Badge variant={chat.type === 'product' ? 'new' : chat.type === 'consultation' ? 'in-progress' : 'pending'} className="text-[8px] shrink-0">
                      {chat.type}
                    </Badge>
                  </div>
                  {chat.productRef && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-[var(--bg-surface-elevated)] rounded-sm border border-[var(--border-secondary)]">
                      <Package className="w-3 h-3 text-safety-orange shrink-0" />
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] truncate">{chat.productRef.name}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center text-center">
                <MessageCircle className="w-12 h-12 text-[var(--text-muted)] mb-4" />
                <h4 className="text-lg font-black text-[var(--text-primary)] uppercase mb-2">No Conversations</h4>
                <p className="text-xs text-[var(--text-muted)]">Start a chat from a product page or consultation.</p>
              </div>
            )}
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {selectedChat ? (
              <div className="flex flex-col h-[65vh] border border-[var(--border-primary)] rounded-sm overflow-hidden bg-[var(--bg-secondary)]">
                {/* Chat Header */}
                <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-surface)] flex items-center gap-3">
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
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-safety-orange/10 rounded-sm border border-safety-orange/20">
                      <Package className="w-3 h-3 text-safety-orange" />
                      <span className="text-[10px] font-bold text-safety-orange">{selectedChat.productRef.name}</span>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="py-10 flex justify-center"><Activity className="w-6 h-6 text-safety-orange animate-spin" /></div>
                  ) : messages.length > 0 ? (
                    messages.map(msg => {
                      const isMe = msg.senderId === userEmail;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] px-4 py-3 rounded-sm ${
                            isMe
                              ? 'bg-safety-orange text-white'
                              : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>
                              {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
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
                <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-surface)]">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      className="flex-grow h-10 text-sm bg-[var(--bg-input)] border-[var(--border-primary)]"
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
              <div className="hidden lg:flex flex-col items-center justify-center h-[65vh] border border-[var(--border-primary)] rounded-sm bg-[var(--bg-surface)]">
                <MessageCircle className="w-16 h-16 text-[var(--text-muted)] mb-4" />
                <h4 className="text-xl font-black text-[var(--text-primary)] uppercase mb-2">Select a Conversation</h4>
                <p className="text-sm text-[var(--text-muted)]">Choose a chat from the sidebar to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
