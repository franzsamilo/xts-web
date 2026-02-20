"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { MessageSquare, ThumbsUp, Share2, Pin, CheckCircle2, X, Activity } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  avatar: string;
  tag: string;
  likes: number;
  likedBy?: string[];
  comments: number;
  isPinned: boolean;
  createdAt?: string;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTag, setPostTag] = useState('Build Log');
  const [publishing, setPublishing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const userId = (session?.user as any)?.id || session?.user?.email || '';

  // Fetch posts from Firestore on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          setPosts(data);

          // Mark posts the current user has already liked
          if (userId) {
            const alreadyLiked = new Set<string>();
            data.forEach((p: Post) => {
              if (p.likedBy?.includes(userId)) {
                alreadyLiked.add(p.id);
              }
            });
            setLikedPosts(alreadyLiked);
          }
        }
      } catch (e) {
        console.error('Failed to fetch posts', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [userId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePublish = async () => {
    if (!postTitle.trim() || !postContent.trim()) return;
    setPublishing(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle.trim(),
          content: postContent.trim(),
          tag: postTag,
        }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [{ ...newPost, createdAt: new Date().toISOString() }, ...prev]);
        setPostTitle('');
        setPostContent('');
        setPostTag('Build Log');
        setShowCreate(false);
        showToast('Post published successfully!');
      }
    } catch (e) {
      console.error('Failed to publish post', e);
      showToast('Failed to publish. Try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (id: string) => {
    if (likedPosts.has(id) || likingIds.has(id)) return;

    // Optimistic update
    setLikedPosts(prev => new Set(prev).add(id));
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    setLikingIds(prev => new Set(prev).add(id));

    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'PATCH' });
      if (res.ok) {
        const result = await res.json();
        if (result.alreadyLiked) {
          // Revert optimistic update if server says already liked
          setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: result.likes } : p));
        }
      }
    } catch (e) {
      // Revert on error
      setLikedPosts(prev => { const next = new Set(prev); next.delete(id); return next; });
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes - 1 } : p));
    } finally {
      setLikingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const tagOptions = ['Build Log', 'Question', 'Discussion', 'Showcase', 'Tutorial'];

  return (
    <PageShell>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[100] px-6 py-4 rounded-sm shadow-2xl border bg-green-950 border-green-500/50 text-green-200 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500" />
            <p className="text-sm font-bold">{toast}</p>
            <button onClick={() => setToast(null)} className="ml-2 text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <SectionHeading 
            title="The Feed" 
            annotation="Engineering Community" 
            dark={true}
            className="mb-0"
          />
          <Button onClick={() => setShowCreate(!showCreate)} className="whitespace-nowrap">
            {showCreate ? 'Close Editor' : 'Create Post'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-8">
            {/* Post Creation Form */}
            <AnimatePresence>
              {showCreate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="mb-4 border-2 border-safety-orange/30">
                    <div className="space-y-6">
                      <h3 className="text-xl font-black uppercase text-esd-dark">Share your Work</h3>

                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Post Type</label>
                        <div className="flex flex-wrap gap-2">
                          {tagOptions.map(tag => (
                            <button
                              key={tag}
                              onClick={() => setPostTag(tag)}
                              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${
                                postTag === tag
                                  ? 'bg-safety-orange border-safety-orange text-white'
                                  : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:border-zinc-400'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Input 
                        placeholder="Post Title" 
                        className="bg-white border-zinc-200 text-esd-dark" 
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                      />
                      <Textarea 
                        placeholder="What are you building? Share your progress, ask questions, or start a discussion..." 
                        className="bg-white border-zinc-200 text-esd-dark min-h-[120px]" 
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                          Posting as @{session?.user?.name?.split(' ')[0] || 'Anonymous'}
                        </span>
                        <div className="flex gap-4">
                          <Button variant="ghost" className="text-zinc-500" onClick={() => { setShowCreate(false); setPostTitle(''); setPostContent(''); }}>Cancel</Button>
                          <Button 
                            onClick={handlePublish} 
                            disabled={!postTitle.trim() || !postContent.trim() || publishing}
                            className="shadow-[0_4px_0_0_#995400] active:translate-y-[2px] active:shadow-none transition-all"
                          >
                            {publishing ? 'Publishing...' : 'Publish Post'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Posts */}
            {loading ? (
              <div className="py-20 flex justify-center">
                <Activity className="w-8 h-8 text-safety-orange animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="relative group">
                        {post.isPinned && (
                          <div className="absolute top-4 right-4 text-safety-orange flex items-center gap-1">
                            <Pin className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black uppercase">Pinned</span>
                          </div>
                        )}
                        
                        <div className="flex gap-6">
                          <div className="hidden sm:flex flex-col items-center shrink-0">
                            <div className="w-12 h-12 bg-zinc-800 rounded-sm flex items-center justify-center text-white font-black mb-2 shadow-lg border border-white/10">
                              {post.avatar}
                            </div>
                            <div className="h-full w-px bg-zinc-200" />
                          </div>

                          <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge variant={post.tag === 'Announcement' ? 'new' : post.tag === 'Question' ? 'warning' : 'pending'}>{post.tag}</Badge>
                              <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">
                                @{post.author} • {timeAgo(post.createdAt)}
                              </span>
                            </div>
                            
                            <h3 className="text-2xl font-black text-esd-dark uppercase mb-4 group-hover:text-safety-orange transition-colors cursor-pointer">
                              {post.title}
                            </h3>
                            
                            <p className="text-zinc-600 mb-8 leading-relaxed whitespace-pre-wrap">
                              {post.content}
                            </p>

                            <div className="flex items-center gap-8 pt-6 border-t border-black/5">
                              <button 
                                className={`flex items-center gap-2 transition-colors ${
                                  likedPosts.has(post.id) 
                                    ? 'text-safety-orange cursor-default' 
                                    : 'text-zinc-500 hover:text-safety-orange'
                                }`} 
                                onClick={() => handleLike(post.id)}
                                disabled={likedPosts.has(post.id)}
                              >
                                <ThumbsUp className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                <span className="text-sm font-bold">{post.likes}</span>
                                {likedPosts.has(post.id) && (
                                  <span className="text-[10px] font-black uppercase tracking-widest ml-1">Liked</span>
                                )}
                              </button>
                              <button className="flex items-center gap-2 text-zinc-500 hover:text-safety-orange transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm font-bold">{post.comments}</span>
                              </button>
                              <button 
                                className="flex items-center gap-2 text-zinc-500 hover:text-safety-orange transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/community#${post.id}`);
                                  showToast('Link copied to clipboard!');
                                }}
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="py-24 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center mb-6">
                        <MessageSquare className="w-8 h-8 text-zinc-700" />
                      </div>
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">The Feed is Quiet</h4>
                      <p className="text-sm text-zinc-500 max-w-sm mb-8 font-medium">Be the first to share a build log, ask a question, or start a discussion with the community.</p>
                      <Button onClick={() => setShowCreate(true)}>Create First Post</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="p-8 bg-zinc-900 border border-white/5 rounded-sm shadow-2xl">
              <h4 className="text-lg font-black text-white uppercase mb-6 tracking-tighter">Top Contributors</h4>
              <div className="space-y-4">
                {['RobotDave', 'CircuitQueen', 'TechLead', 'FabMaster'].map((user, i) => (
                  <div key={user} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-black">{user[0]}</div>
                      <span className="text-sm font-bold text-zinc-400">@{user}</span>
                    </div>
                    <Badge variant="new" className="text-[8px] px-1 pointer-events-none">Rank {i + 1}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-zinc-900 border border-white/5 rounded-sm shadow-2xl">
              <h4 className="text-lg font-black text-white uppercase mb-6 tracking-tighter">Feed Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-500 font-bold uppercase">Total Posts</span>
                  <span className="text-sm font-black text-safety-orange">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-500 font-bold uppercase">Total Likes</span>
                  <span className="text-sm font-black text-safety-orange">{posts.reduce((s, p) => s + p.likes, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-500 font-bold uppercase">Your Likes</span>
                  <span className="text-sm font-black text-safety-orange">{likedPosts.size}</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-safety-orange rounded-sm shadow-2xl skew-y-1">
              <div className="-skew-y-1">
                <h4 className="text-lg font-black text-esd-dark uppercase mb-4 tracking-tighter">Hackathon #4</h4>
                <p className="text-sm text-esd-dark font-medium mb-6">Join our next build-off starting March 1st. Theme: &quot;Edge Robotics&quot;.</p>
                <Button variant="secondary" className="w-full text-xs py-2 bg-esd-dark text-white shadow-none">Register Now</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
