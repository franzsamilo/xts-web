"use client";

import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { UploadZone } from '@/components/fabrication/UploadZone';
import { ServiceQueue } from '@/components/fabrication/ServiceQueue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function FabricationPage() {
  return (
    <PageShell>
      <div className="container mx-auto px-4 py-20">
        <SectionHeading 
          title="Fabrication Portal" 
          annotation="From CAD to Component" 
          dark={true} 
        />
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="mb-12 flex gap-4 bg-zinc-900/50 p-1 rounded-sm border border-white/5 inline-flex">
            <TabsTrigger value="upload" className="px-8 py-3 rounded-sm font-black uppercase text-sm tracking-tighter transition-all data-[state=active]:bg-safety-orange data-[state=active]:text-white text-zinc-500">
              New Request
            </TabsTrigger>
            <TabsTrigger value="queue" className="px-8 py-3 rounded-sm font-black uppercase text-sm tracking-tighter transition-all data-[state=active]:bg-safety-orange data-[state=active]:text-white text-zinc-500">
              Live Queue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <UploadZone />
              </div>
              <div>
                <div className="sticky top-32">
                  <div className="p-8 bg-zinc-800/50 border border-white/5 rounded-sm mb-8">
                    <h4 className="text-xl font-black text-white uppercase mb-4 tracking-tighter">Guidelines</h4>
                    <ul className="space-y-4 font-medium text-zinc-400 text-sm">
                      <li className="flex gap-3">
                        <span className="text-safety-orange">•</span>
                        STL files must be binary format.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-safety-orange">•</span>
                        DXF units should be in millimeters.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-safety-orange">•</span>
                        Pack Gerber files in a .ZIP archive.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-safety-orange">•</span>
                        Maximum file size: 50MB.
                      </li>
                    </ul>
                  </div>

                  <div className="p-1 px-1 bg-yellow-500/20 rounded-sm">
                    <div className="p-6 bg-zinc-900 border border-yellow-500/30 rounded-sm">
                      <p className="font-handwriting text-yellow-500 italic text-sm">
                        "Need help with your design? Our experts can help you optimize for manufacturing."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="queue">
            <div className="max-w-4xl">
              <ServiceQueue />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}

