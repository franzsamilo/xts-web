"use client";

import React from 'react';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: '',
  onValueChange: () => {},
});

export const Tabs = ({ 
  defaultValue, 
  value, 
  onValueChange, 
  children, 
  className 
}: { 
  defaultValue?: string; 
  value?: string; 
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  const [activeValue, setActiveValue] = React.useState(value || defaultValue || '');

  const handleChange = (newValue: string) => {
    if (!value) setActiveValue(newValue);
    if (onValueChange) onValueChange(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: value || activeValue, onValueChange: handleChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex", className)}>{children}</div>
);

export const TabsTrigger = ({ 
  value, 
  children, 
  className 
}: { 
  value: string; 
  children: React.ReactNode; 
  className?: string;
}) => {
  const { value: activeValue, onValueChange } = React.useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      onClick={() => onValueChange(value)}
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(className)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ 
  value, 
  children, 
  className 
}: { 
  value: string; 
  children: React.ReactNode; 
  className?: string;
}) => {
  const { value: activeValue } = React.useContext(TabsContext);
  if (activeValue !== value) return null;

  return <div className={cn(className)}>{children}</div>;
};
