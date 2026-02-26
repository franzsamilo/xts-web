"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { PenTool, Activity } from 'lucide-react';

const LoadingGauge = ({ progress, status }: { progress: number; status: string }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SYSTEM STATE: {status}</span>
        <span className="text-[10px] font-mono leading-none text-safety-orange">{progress}%</span>
      </div>
      <div className="h-6 bg-zinc-900 border-2 border-zinc-700 p-1 relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.25)_50%),linear-gradient(90deg,rgba(255,0,0,.06),rgba(0,255,0,.02),rgba(0,0,118,.06))] bg-[length:100%_2px,3px_100%] z-10" />
        <div className="flex gap-1 h-full w-full">
          {Array.from({ length: 20 }).map((_, i) => {
            const blockThreshold = (i + 1) * 5;
            const isActive = progress >= blockThreshold;
            const isLatest = progress >= blockThreshold && progress < blockThreshold + 5;
            return (
              <motion.div 
                key={i}
                initial={false}
                animate={{ 
                  backgroundColor: isActive ? '#FF8C00' : '#18181b',
                  opacity: isLatest ? [0.5, 1, 0.5] : 1
                }}
                transition={{ duration: 0.5, repeat: isLatest ? Infinity : 0 }}
                className="flex-grow h-full"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ServiceJob {
  id: string;
  name: string;
  progress: number;
  status: string;
  files?: string[];
  customerName?: string;
  createdAt?: string;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'Less than an hour ago';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const ServiceQueue = ({ orders, autoFetch = false }: { orders?: ServiceJob[], autoFetch?: boolean }) => {
  const [jobs, setJobs] = useState<ServiceJob[]>(orders || []);
  const [loading, setLoading] = useState(autoFetch);

  useEffect(() => {
    if (!autoFetch) return;
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/fabrication');
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (e) {
        console.error('Failed to fetch fab jobs', e);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [autoFetch]);

  // If orders prop is passed, use it directly
  useEffect(() => {
    if (orders) setJobs(orders);
  }, [orders]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Activity className="w-8 h-8 text-safety-orange animate-spin" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="py-20 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center bg-black/10">
        <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center mb-6 rotate-45 group">
           <PenTool className="w-8 h-8 text-zinc-700 -rotate-45 group-hover:text-safety-orange transition-colors" />
        </div>
        <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Queue Is Nominal</h4>
        <p className="text-sm text-zinc-500 max-w-sm mb-8 font-medium">No fabrication requests are currently being processed by our facility.</p>
        <button 
           onClick={() => window.location.href = '/services'}
           className="px-8 py-3 bg-zinc-800 text-white text-xs font-black uppercase tracking-widest hover:bg-safety-orange transition-all border border-white/10"
        >
          Initialize New Request
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {jobs.map((job) => (
        <Card key={job.id} className="relative overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={job.status === 'completed' ? 'completed' : job.status === 'in-progress' ? 'in-progress' : 'pending'}>
                  {job.id.slice(0, 8).toUpperCase()}
                </Badge>
                <span className="text-zinc-400 text-xs font-bold uppercase">{timeAgo(job.createdAt)}</span>
              </div>
              <h4 className="text-xl font-black text-esd-dark uppercase mb-2">{job.name}</h4>
              {job.files && job.files.length > 0 && (
                <p className="text-xs text-zinc-500 font-mono mb-4">{job.files.join(', ')}</p>
              )}
              {job.customerName && (
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4">Client: {job.customerName}</p>
              )}
              
              <LoadingGauge progress={job.progress} status={job.status} />
            </div>

            <div className="flex flex-col gap-2 shrink-0 md:text-right">
              <span className="text-[10px] font-black uppercase text-zinc-400">Target Dept</span>
              <span className="text-sm font-bold text-esd-dark">CNC MACHINING CENTER</span>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-black/[0.02] to-transparent pointer-events-none" />
        </Card>
      ))}
    </div>
  );
};
