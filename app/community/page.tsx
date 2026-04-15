"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { MessageSquare, ThumbsUp, Share2, Pin, CheckCircle2, X, Activity, Send, Upload, Image as ImageIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  content: string;
  author: string;
  avatar: string;
  createdAt: string;
}

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
  imageUrls?: string[];
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

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Comment state
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<Set<string>>(new Set());
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());

  const userId = (session?.user as any)?.id || session?.user?.email || '';

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
          if (userId) {
            const alreadyLiked = new Set<string>();
            data.forEach((p: Post) => {
              if (p.likedBy?.includes(userId)) alreadyLiked.add(p.id);
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
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!postTitle.trim() || !postContent.trim()) return;
    setPublishing(true);
    try {
      // Upload images first
      const uploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploading(true);
        for (const file of imageFiles) {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: fd });
          if (res.ok) {
            const data = await res.json();
            uploadedUrls.push(data.url);
          }
        }
        setUploading(false);
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle.trim(),
          content: postContent.trim(),
          tag: postTag,
          imageUrls: uploadedUrls,
        }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [{ ...newPost, createdAt: new Date().toISOString(), imageUrls: uploadedUrls }, ...prev]);
        setPostTitle('');
        setPostContent('');
        setPostTag('Build Log');
        setImageFiles([]);
        setImagePreviews([]);
        setShowCreate(false);
        showToast('Post published successfully!');
      }
    } catch (e) {
      showToast('Failed to publish. Try again.');
    } finally {
      setPublishing(false);
      setUploading(false);
    }
  };

  const handleLike = async (id: string) => {
    if (likedPosts.has(id) || likingIds.has(id)) return;
    setLikedPosts(prev => new Set(prev).add(id));
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    setLikingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'PATCH' });
      if (res.ok) {
        const result = await res.json();
        if (result.alreadyLiked) {
          setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: result.likes } : p));
        }
      }
    } catch {
      setLikedPosts(prev => { const n = new Set(prev); n.delete(id); return n; });
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes - 1 } : p));
    } finally {
      setLikingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const toggleComments = async (postId: string) => {
    const next = new Set(expandedComments);
    if (next.has(postId)) {
      next.delete(postId);
      setExpandedComments(next);
      return;
    }
    next.add(postId);
    setExpandedComments(next);

    if (!commentsByPost[postId]) {
      setLoadingComments(prev => new Set(prev).add(postId));
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (res.ok) {
          const comments = await res.json();
          setCommentsByPost(prev => ({ ...prev, [postId]: comments }));
        }
      } catch (e) {
        console.error('Failed to load comments', e);
      } finally {
        setLoadingComments(prev => { const n = new Set(prev); n.delete(postId); return n; });
      }
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;

    setSendingComment(prev => new Set(prev).add(postId));
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setCommentsByPost(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment],
        }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
        setCommentInput(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (e) {
      showToast('Failed to post comment.');
    } finally {
      setSendingComment(prev => { const n = new Set(prev); n.delete(postId); return n; });
    }
  };

  const tagOptions = ['Build Log', 'Question', 'Discussion', 'Showcase', 'Tutorial'];

  // Compute actual top contributors from posts
  const contributorMap = new Map<string, number>();
  posts.forEach(p => {
    contributorMap.set(p.author, (contributorMap.get(p.author) || 0) + 1);
  });
  const topContributors = Array.from(contributorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

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

      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 overflow-x-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-10 sm:mb-16">
          <SectionHeading title="The Feed" annotation="Engineering Community" dark={true} className="mb-0" />
          <Button onClick={() => setShowCreate(!showCreate)} className="whitespace-nowrap">
            {showCreate ? 'Close Editor' : 'Create Post'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3 space-y-8">
            {/* Create */}
            <AnimatePresence>
              {showCreate && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  <Card className="mb-4 border-2 border-safety-orange/30">
                    <div className="space-y-6">
                      <h3 className="text-xl font-black uppercase text-esd-dark">Share your Work</h3>
                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Post Type</label>
                        <div className="flex flex-wrap gap-2">
                          {tagOptions.map(tag => (
                            <button key={tag} onClick={() => setPostTag(tag)}
                              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${
                                postTag === tag ? 'bg-safety-orange border-safety-orange text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:border-zinc-400'
                              }`}
                            >{tag}</button>
                          ))}
                        </div>
                      </div>
                      <Input placeholder="Post Title" className="bg-white border-zinc-200 text-esd-dark" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} />
                      <Textarea placeholder="What are you building?..." className="bg-white border-zinc-200 text-esd-dark min-h-[120px]" value={postContent} onChange={(e) => setPostContent(e.target.value)} />

                      {/* Photo Upload */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Photos</label>
                        <div className="flex flex-wrap gap-3">
                          {imagePreviews.map((url, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-sm overflow-hidden border-2 border-safety-orange">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className="w-20 h-20 border-2 border-dashed border-zinc-300 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-safety-orange transition-colors">
                            <ImageIcon className="w-5 h-5 text-zinc-400 mb-1" />
                            <span className="text-[8px] text-zinc-400 font-bold">ADD</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Posting as @{session?.user?.name?.split(' ')[0] || 'Anonymous'}</span>
                        <div className="flex gap-4">
                          <Button variant="ghost" className="text-zinc-500" onClick={() => { setShowCreate(false); setPostTitle(''); setPostContent(''); setImageFiles([]); setImagePreviews([]); }}>Cancel</Button>
                          <Button onClick={handlePublish} disabled={!postTitle.trim() || !postContent.trim() || publishing}
                            className="shadow-[0_4px_0_0_#995400] active:translate-y-[2px] active:shadow-none transition-all">
                            {publishing ? (uploading ? 'Uploading Photos...' : 'Publishing...') : 'Publish Post'}
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
              <div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>
            ) : (
              <AnimatePresence mode="popLayout">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <motion.div key={post.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                      <Card className="relative group">
                        {post.isPinned && (
                          <div className="absolute top-4 right-4 text-safety-orange flex items-center gap-1">
                            <Pin className="w-3 h-3 fill-current" /><span className="text-[10px] font-black uppercase">Pinned</span>
                          </div>
                        )}
                        <div className="flex gap-6">
                          <div className="hidden sm:flex flex-col items-center shrink-0">
                            <div className="w-12 h-12 bg-zinc-800 rounded-sm flex items-center justify-center text-white font-black mb-2 shadow-lg border border-white/10">{post.avatar}</div>
                            <div className="h-full w-px bg-zinc-200" />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-3 min-w-0">
                              <Badge variant={post.tag === 'Announcement' ? 'new' : post.tag === 'Question' ? 'warning' : 'pending'}>{post.tag}</Badge>
                              <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter truncate">@{post.author} • {timeAgo(post.createdAt)}</span>
                            </div>
                            <h3 className="text-2xl font-black text-esd-dark uppercase mb-4 group-hover:text-safety-orange transition-colors cursor-pointer break-words">{post.title}</h3>
                            <p className="text-zinc-600 mb-4 leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>

                            {/* Post Images */}
                            {post.imageUrls && post.imageUrls.length > 0 && (
                              <div className={`mb-6 grid gap-2 ${
                                post.imageUrls.length === 1 ? 'grid-cols-1' :
                                post.imageUrls.length === 2 ? 'grid-cols-2' :
                                'grid-cols-2 sm:grid-cols-3'
                              }`}>
                                {post.imageUrls.map((url, i) => (
                                  <div key={i} className="rounded-sm overflow-hidden border border-black/5 aspect-video">
                                    <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-8 pt-6 border-t border-black/5">
                              {/* Like */}
                              <button
                                className={`flex items-center gap-2 transition-colors ${likedPosts.has(post.id) ? 'text-safety-orange cursor-default' : 'text-zinc-500 hover:text-safety-orange'}`}
                                onClick={() => handleLike(post.id)} disabled={likedPosts.has(post.id)}
                              >
                                <ThumbsUp className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                <span className="text-sm font-bold">{post.likes}</span>
                                {likedPosts.has(post.id) && <span className="text-[10px] font-black uppercase tracking-widest ml-1">Liked</span>}
                              </button>
                              {/* Comments toggle */}
                              <button
                                className={`flex items-center gap-2 transition-colors ${expandedComments.has(post.id) ? 'text-safety-orange' : 'text-zinc-500 hover:text-safety-orange'}`}
                                onClick={() => toggleComments(post.id)}
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm font-bold">{post.comments}</span>
                              </button>
                              {/* Share */}
                              <button className="flex items-center gap-2 text-zinc-500 hover:text-safety-orange transition-colors"
                                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/community#${post.id}`); showToast('Link copied!'); }}>
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Comments Section */}
                            <AnimatePresence>
                              {expandedComments.has(post.id) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-6 pt-6 border-t border-black/5"
                                >
                                  {/* Existing comments */}
                                  {loadingComments.has(post.id) ? (
                                    <div className="py-4 flex justify-center"><Activity className="w-5 h-5 text-safety-orange animate-spin" /></div>
                                  ) : (
                                    <div className="space-y-4 mb-6">
                                      {(commentsByPost[post.id] || []).length === 0 ? (
                                        <p className="text-xs text-zinc-500 italic text-center py-4">No comments yet. Be the first to respond.</p>
                                      ) : (
                                        (commentsByPost[post.id] || []).map((c) => (
                                          <div key={c.id} className="flex gap-3">
                                            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] text-white font-black shrink-0 border border-white/10">
                                              {c.avatar}
                                            </div>
                                            <div className="flex-grow bg-[var(--bg-surface)] rounded-sm p-3 border border-[var(--border-secondary)]">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-esd-dark uppercase">@{c.author}</span>
                                                <span className="text-[10px] text-zinc-400">{timeAgo(c.createdAt)}</span>
                                              </div>
                                              <p className="text-sm text-[var(--text-secondary)]">{c.content}</p>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}

                                  {/* Comment input */}
                                  {session ? (
                                    <div className="flex gap-3">
                                      <div className="w-8 h-8 bg-safety-orange rounded-full flex items-center justify-center text-[10px] text-white font-black shrink-0">
                                        {session.user?.name?.[0]?.toUpperCase() || '?'}
                                      </div>
                                      <div className="flex-grow flex gap-2">
                                        <Input
                                          placeholder="Write a comment..."
                                          className="bg-white border-zinc-200 text-esd-dark text-sm flex-grow"
                                          value={commentInput[post.id] || ''}
                                          onChange={(e) => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(post.id); } }}
                                        />
                                        <Button
                                          size="sm"
                                          className="px-3 min-w-0"
                                          disabled={!commentInput[post.id]?.trim() || sendingComment.has(post.id)}
                                          onClick={() => handleComment(post.id)}
                                        >
                                          {sendingComment.has(post.id) ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-zinc-500 italic text-center">Sign in to comment.</p>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
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
                      <p className="text-sm text-zinc-500 max-w-sm mb-8 font-medium">Be the first to share a build log, ask a question, or start a discussion.</p>
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
                {topContributors.length > 0 ? (
                  topContributors.map(([user, count], i) => (
                    <div key={user} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-black text-white">{user[0]?.toUpperCase()}</div>
                        <span className="text-sm font-bold text-zinc-400 truncate">@{user}</span>
                      </div>
                      <Badge variant="new" className="text-[8px] px-1 pointer-events-none">{count} post{count !== 1 ? 's' : ''}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic">No contributors yet.</p>
                )}
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
