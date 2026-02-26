"use client";

import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { TermsModal } from '@/components/ui/TermsModal';

interface PageShellProps {
  children: React.ReactNode;
}

export const PageShell = ({ children }: PageShellProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32">
        {children}
      </main>
      <Footer />
      <TermsModal />
    </div>
  );
};
