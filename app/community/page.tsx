"use client";

import React, { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { MessageSquare, ThumbsUp, Share2, User, Search, Pin } from 'lucide-react';

const initialPosts: any[] = [];

export default function CommunityPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-20">
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
            {showCreate && (
              <Card className="mb-12 border-2 border-safety-orange/30">
                <div className="space-y-6">
                  <h3 className="text-xl font-black uppercase text-esd-dark">Share your Work</h3>
                  <Input placeholder="Post Title" className="bg-white border-zinc-200 text-esd-dark focus:ring-safety-orange" />
                  <Textarea placeholder="What are you building?" className="bg-white border-zinc-200 text-esd-dark focus:ring-safety-orange" />
                  <div className="flex justify-end gap-4">
                    <Button variant="ghost" className="text-zinc-500" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button>Publish Post</Button>
                  </div>
                </div>
              </Card>
            )}

            {posts.length > 0 ? (
              posts.map((post) => (
                <Card key={post.id} className="relative group">
                  {post.isPinned && (
                    <div className="absolute top-4 right-4 text-safety-orange flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-black uppercase">Pinned</span>
                    </div>
                  )}
                  
                  <div className="flex gap-6">
                    {/* Author Info */}
                    <div className="hidden sm:flex flex-col items-center shrink-0">
                      <div className="w-12 h-12 bg-zinc-800 rounded-sm flex items-center justify-center text-white font-black mb-2 shadow-lg border border-white/10">
                        {post.avatar}
                      </div>
                      <div className="h-full w-px bg-zinc-200" />
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant={post.tag === 'Announcement' ? 'new' : 'pending'}>{post.tag}</Badge>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">@{post.author} • {post.time}</span>
                      </div>
                      
                      <h3 className="text-2xl font-black text-esd-dark uppercase mb-4 group-hover:text-safety-orange transition-colors cursor-pointer">
                        {post.title}
                      </h3>
                      
                      <p className="text-zinc-600 mb-8 leading-relaxed">
                        {post.content}
                      </p>

                      <div className="flex items-center gap-8 pt-6 border-t border-black/5">
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-safety-orange transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm font-bold">{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-safety-orange transition-colors">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm font-bold">{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-safety-orange transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="py-24 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-zinc-700" />
                </div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">The Feed is Quiet</h4>
                <p className="text-sm text-zinc-500 max-w-sm mb-8 font-medium">Be the first to share a build log, ask a question, or start a discussion with the community.</p>
                <Button onClick={() => setShowCreate(true)}>Create First Post</Button>
              </div>
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

            <div className="p-8 bg-safety-orange rounded-sm shadow-2xl skew-y-1">
              <div className="-skew-y-1">
                <h4 className="text-lg font-black text-esd-dark uppercase mb-4 tracking-tighter">Hackathon #4</h4>
                <p className="text-sm text-esd-dark font-medium mb-6">Join our next build-off starting March 1st. Theme: "Edge Robotics".</p>
                <Button variant="secondary" className="w-full text-xs py-2 bg-esd-dark text-white shadow-none">Register Now</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
