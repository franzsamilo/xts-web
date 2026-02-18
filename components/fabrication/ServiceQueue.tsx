"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { PenTool } from 'lucide-react';

const LoadingGauge = ({ progress, status }: { progress: number; status: string }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SYSTEM STATE: {status}</span>
        <span className="text-[10px] font-mono leading-none text-safety-orange">{progress}%</span>
      </div>
      {/* Vintage CNC Gauge Frame */}
      <div className="h-6 bg-zinc-900 border-2 border-zinc-700 p-1 relative overflow-hidden shadow-inner">
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.25)_50%),linear-gradient(90deg,rgba(255,0,0,.06),rgba(0,255,0,.02),rgba(0,0,118,.06))] bg-[length:100%_2px,3px_100%] z-10" />
        
        {/* Gauge Blocks */}
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
  date: string;
}

export const ServiceQueue = ({ orders = [] }: { orders?: ServiceJob[] }) => {
  if (orders.length === 0) {
    return (
      <div className="py-20 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center bg-black/10">
        <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-sm flex items-center justify-center mb-6 rotate-45 group">
           <PenTool className="w-8 h-8 text-zinc-700 -rotate-45 group-hover:text-safety-orange transition-colors" />
        </div>
        <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Queue Is Nominal</h4>
        <p className="text-sm text-zinc-500 max-w-sm mb-8 font-medium">No fabrication requests are currently being processed by our facility.</p>
        <button 
           onClick={() => window.location.href = '/fabrication'}
           className="px-8 py-3 bg-zinc-800 text-white text-xs font-black uppercase tracking-widest hover:bg-safety-orange transition-all border border-white/10"
        >
          Initialize New Request
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {orders.map((order) => (
        <Card key={order.id} className="relative overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={order.status === 'Completed' ? 'completed' : 'in-progress'}>
                  {order.id}
                </Badge>
                <span className="text-zinc-400 text-xs font-bold uppercase">{order.date}</span>
              </div>
              <h4 className="text-xl font-black text-esd-dark uppercase mb-6">{order.name}</h4>
              
              <LoadingGauge progress={order.progress} status={order.status} />
            </div>

            <div className="flex flex-col gap-2 shrink-0 md:text-right">
              <span className="text-[10px] font-black uppercase text-zinc-400">Target Dept</span>
              <span className="text-sm font-bold text-esd-dark">CNC MACHINING CENTER</span>
              <button className="text-xs font-handwriting text-safety-orange hover:underline mt-2">
                Download Technical Report →
              </button>
            </div>
          </div>
          
          {/* Shadow mask decorative element */}
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-black/[0.02] to-transparent pointer-events-none" />
        </Card>
      ))}
    </div>
  );
};
