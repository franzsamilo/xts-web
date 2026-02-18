"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  disabled,
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: 'bg-safety-orange text-white hover:bg-safety-orange-dark shadow-[0_4px_0_0_#995400]',
    secondary: 'bg-steel-grey text-esd-dark hover:bg-zinc-200 shadow-[0_4px_0_0_#66757f]',
    ghost: 'bg-transparent text-white hover:bg-white/10',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_4px_0_0_#991b1b]',
    outline: 'border-2 border-safety-orange text-safety-orange hover:bg-safety-orange/10',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base font-semibold',
    lg: 'px-8 py-4 text-lg font-bold uppercase tracking-wider',
  };

  return (
    <motion.button
      whileTap={{ y: 2, boxShadow: 'none' }}
      whileHover={{ y: -1 }}
      className={cn(
        'btn-press inline-flex items-center justify-center rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </motion.button>
  );
};
