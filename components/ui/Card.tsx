"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  annotation?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, annotation, hoverEffect = true, onClick }: CardProps) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverEffect ? { y: -4, scale: 1.02 } : {}}
      className={cn(
        'paper-card paper-texture p-6 rounded-sm relative',
        className,
        onClick && 'cursor-pointer'
      )}
    >
      {annotation && (
        <div className="absolute -top-3 -right-2 bg-yellow-100 px-2 py-1 border border-yellow-300 shadow-sm rotate-3">
          <span className="font-handwriting text-xs text-yellow-800 leading-none">
            {annotation}
          </span>
        </div>
      )}
      {children}
    </motion.div>
  );
};
