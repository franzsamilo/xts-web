import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

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
    </div>
  );
};
