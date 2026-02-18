"use client";

import React from 'react';
import Image from "next/image";
import { motion } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { FabricationIcon, ConsultationIcon, ShopIcon, CommunityIcon } from '@/components/icons';
import { ArrowRight, Box, Cpu, Hammer } from 'lucide-react';

const featuredProducts = [
  { id: 1, name: 'Core Controller V4', price: '$89.00', category: 'Robotics', tag: 'Hot' },
  { id: 2, name: 'Precision Stepper Motor', price: '$24.50', category: 'Motion', tag: 'New' },
  { id: 3, name: 'LiPo Battery Pack 3S', price: '$35.00', category: 'Power', tag: 'In Stock' },
  { id: 4, name: 'Aluminum Extrusion Kit', price: '$120.00', category: 'Hardware', tag: 'Free Ship' },
];

const serviceCards = [
  { 
    title: '3D Printing', 
    desc: 'High-precision FDM and SLA printing for prototypes and parts.',
    icon: FabricationIcon,
    annotation: "24h Turnaround"
  },
  { 
    title: 'Laser Cutting', 
    desc: 'Custom cut acrylic, wood, and metal with millimetric accuracy.',
    icon: Hammer,
    annotation: "Precision 0.1mm"
  },
  { 
    title: 'PCB Fabrication', 
    desc: 'Single or multi-layer custom boards with rapid manufacturing.',
    icon: Cpu,
    annotation: "Gerber Validated"
  },
];

export default function Home() {
  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="new" className="mb-6">Project Horizon v1.0</Badge>
              <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                Engineering. <br />
                <span className="text-safety-orange transition-all hover:tracking-normal cursor-default">Fabrication.</span> <br />
                Community.
              </h1>
              <p className="text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
                Unlock the tools, services, and expertise to build the impossible. From hardware kits to custom-machined parts, XTS WEB is your digital workbench.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="group">
                  Browse Shop <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg">
                  Request Fabrication
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="w-full h-full border-4 border-dashed border-white rounded-full scale-150" />
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-zinc-100 py-24 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Essential Gear" 
            annotation="Stocked & Ready" 
            dark={false}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((p) => (
              <Card key={p.id} annotation={p.tag} className="flex flex-col h-full">
                <div className="aspect-square bg-zinc-200 mb-4 rounded-sm flex items-center justify-center">
                  <Box className="w-20 h-20 text-zinc-400 opacity-50" />
                </div>
                <div className="flex-grow">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{p.category}</span>
                  <h3 className="text-xl font-bold text-esd-dark mb-2">{p.name}</h3>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-black text-safety-orange">{p.price}</span>
                  <Button variant="outline" size="sm" className="p-2 min-w-0">
                    <ShopIcon className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" className="text-esd-dark border-esd-dark hover:bg-esd-dark hover:text-white">
              View Full Inventory
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Custom Fab" 
            annotation="From CAD to Reality" 
            dark={true}
            className="text-white"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviceCards.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card annotation={s.annotation} className="h-full border-l-4 border-l-safety-orange">
                  <div className="w-12 h-12 bg-safety-orange/10 flex items-center justify-center rounded-sm mb-6">
                    <s.icon className="w-6 h-6 text-safety-orange" />
                  </div>
                  <h3 className="text-2xl font-black text-esd-dark uppercase mb-4">{s.title}</h3>
                  <p className="text-zinc-600 mb-8 leading-relaxed">
                    {s.desc}
                  </p>
                  <Button variant="primary" className="w-full">
                    Upload Files
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Consultation CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="bg-safety-orange p-1 px-1 rounded-sm shadow-2xl skew-y-[-1deg]">
            <div className="bg-esd-dark p-12 md:p-20 flex flex-col items-center text-center skew-y-[1deg]">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-8">
                <ConsultationIcon className="w-8 h-8 text-safety-orange" />
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">
                Stuck on a Bug? <br />
                <span className="text-safety-orange">Talk to an Expert.</span>
              </h2>
              <p className="text-xl text-zinc-400 max-w-2xl mb-12">
                Don't let technical hurdles stop your progress. Book a 1-on-1 session with our engineers for CAD design, robotics logic, or hardware debugging.
              </p>
              <Button size="lg" className="bg-white text-esd-dark hover:bg-zinc-200 shadow-[0_4px_0_0_#d4d4d8]">
                Schedule Session
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-24 bg-zinc-100 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="The Feed" 
            annotation="Build Logs & Reviews" 
            dark={false}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card annotation="Recent Build" className="group">
              <div className="flex gap-6">
                <div className="hidden sm:block w-32 h-32 bg-zinc-200 rounded-sm shrink-0 overflow-hidden">
                  <Box className="w-full h-full p-8 text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2 group-hover:text-safety-orange transition-colors cursor-pointer">Autonomous Rover with LiDAR Mapping</h4>
                  <p className="text-zinc-600 mb-4 line-clamp-2">Just finished the first version of my mapping rover. Used the Core V4 from the shop and some custom laser-cut chassis parts...</p>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase">
                    <span>By @RobotDave</span>
                    <span>•</span>
                    <span>12 Comments</span>
                  </div>
                </div>
              </div>
            </Card>
            <Card annotation="Question" className="group">
              <div className="flex gap-6">
                <div className="hidden sm:block w-32 h-32 bg-zinc-200 rounded-sm shrink-0 flex items-center justify-center">
                  <CommunityIcon className="w-12 h-12 text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2 group-hover:text-safety-orange transition-colors cursor-pointer">Best way to shield I2C lines in high EMI?</h4>
                  <p className="text-zinc-600 mb-4 line-clamp-2">Having some issues with data corruption when the motors are running. Has anyone tried twisted pair or specific shielding...</p>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase">
                    <span>By @CircuitQueen</span>
                    <span>•</span>
                    <span>5 Answers</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" className="text-esd-dark border-esd-dark">Join the Community</Button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-8 text-center">Get Engineering Updates</h3>
          <div className="flex w-full max-w-md gap-2">
            <input 
              type="email" 
              placeholder="engineer@example.com"
              className="grow bg-zinc-800 border-2 border-zinc-700 px-4 py-3 text-white focus:outline-none focus:border-safety-orange transition-colors"
            />
            <Button>Join</Button>
          </div>
          <p className="mt-4 text-zinc-600 text-sm font-handwriting">No spam, just schematics and new part drops.</p>
        </div>
      </section>
    </PageShell>
  );
}
