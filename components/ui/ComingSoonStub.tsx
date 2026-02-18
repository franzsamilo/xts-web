"use client";

import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  icon: React.ReactNode;
}

export const ComingSoonStub = ({ title, icon }: ComingSoonProps) => (
  <PageShell>
    <div className="container mx-auto px-4 py-20 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <SectionHeading title={title} annotation="Phase 2/3 Milestone" dark={true} className="mb-12" />
      <Card className="max-w-xl w-full p-12 flex flex-col items-center">
        <div className="w-20 h-20 bg-safety-orange/10 rounded-full flex items-center justify-center mb-8">
          <div className="text-safety-orange">
            {icon}
          </div>
        </div>
        <h2 className="text-3xl font-black uppercase mb-4 text-esd-dark">Workbench Under Construction</h2>
        <p className="text-zinc-600 mb-10 leading-relaxed font-medium">
          The hardware is arriving and the tools are being calibrated. This module is part of the next development phase.
        </p>
        <Link href="/">
          <Button variant="outline" className="text-esd-dark border-esd-dark px-8">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </Card>
      <div className="mt-12 opacity-30 flex gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-12 h-1 bg-white/20 rounded-full" />
        ))}
      </div>
    </div>
  </PageShell>
);
