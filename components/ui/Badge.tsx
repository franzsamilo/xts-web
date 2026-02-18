import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pending' | 'in-progress' | 'completed' | 'new' | 'warning';
  className?: string;
}

export const Badge = ({ children, variant = 'new', className }: BadgeProps) => {
  const variants = {
    pending: 'bg-zinc-200 text-zinc-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    new: 'bg-safety-orange text-white',
    warning: 'bg-red-100 text-red-800',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold uppercase tracking-tighter border border-black/10 shadow-[1px_1px_0_0_rgba(0,0,0,0.1)]',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
