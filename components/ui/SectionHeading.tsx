import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  annotation?: string;
  className?: string;
  dark?: boolean;
}

export const SectionHeading = ({ title, annotation, className, dark = false }: SectionHeadingProps) => {
  return (
    <div className={cn("mb-12 relative", className)}>
      <h2 className={cn(
        "text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2",
        dark ? "text-white" : "text-esd-dark"
      )}>
        {title}
      </h2>
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-1 grow rounded-full",
          dark ? "bg-white/20" : "bg-black/10"
        )} />
        {annotation && (
          <span className="font-handwriting text-safety-orange text-lg rotate-[-2deg]">
            {annotation}
          </span>
        )}
      </div>
    </div>
  );
};
