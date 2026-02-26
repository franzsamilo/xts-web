"use client";

import React, { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Printer, Scissors, Cpu, ArrowLeft, Upload, Activity, CheckCircle2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';

const serviceOptions = [
  {
    id: '3d-printing',
    name: '3D Printing',
    icon: Printer,
    description: 'High-precision FDM and SLA printing for prototypes, functional parts, and custom enclosures. Supports PLA, ABS, PETG, Resin, and Nylon materials.',
    turnaround: '24-72 hours',
    fields: [
      { name: 'material', label: 'Material', type: 'select', options: ['PLA', 'ABS', 'PETG', 'Resin (SLA)', 'Nylon', 'TPU'] },
      { name: 'infill', label: 'Infill %', type: 'select', options: ['20%', '40%', '60%', '80%', '100%'] },
      { name: 'layerHeight', label: 'Layer Height', type: 'select', options: ['0.1mm (Fine)', '0.2mm (Standard)', '0.3mm (Draft)'] },
      { name: 'color', label: 'Color', type: 'text', placeholder: 'e.g., Black, White, Custom RAL' },
      { name: 'quantity', label: 'Quantity', type: 'number', placeholder: '1' },
      { name: 'dimensions', label: 'Approximate Dimensions (mm)', type: 'text', placeholder: 'e.g., 100x50x30' },
    ],
  },
  {
    id: 'laser-cutting',
    name: 'Laser Cutting',
    icon: Scissors,
    description: 'Precision laser cutting for acrylic, wood, metal, and custom materials with ±0.1mm accuracy. Perfect for panels, enclosures, and structural components.',
    turnaround: '24-48 hours',
    fields: [
      { name: 'material', label: 'Material', type: 'select', options: ['Acrylic', 'Wood (MDF)', 'Wood (Plywood)', 'Stainless Steel', 'Aluminum', 'Carbon Fiber'] },
      { name: 'thickness', label: 'Material Thickness', type: 'select', options: ['1mm', '2mm', '3mm', '5mm', '6mm', '10mm'] },
      { name: 'finish', label: 'Edge Finish', type: 'select', options: ['Raw Cut', 'Polished', 'Flame Polished'] },
      { name: 'quantity', label: 'Quantity', type: 'number', placeholder: '1' },
      { name: 'dimensions', label: 'Sheet Size (mm)', type: 'text', placeholder: 'e.g., 300x200' },
    ],
  },
  {
    id: 'pcb-fabrication',
    name: 'PCB Fabrication',
    icon: Cpu,
    description: 'Custom PCB manufacturing from single-layer to multi-layer boards. Supports standard FR4, flexible PCBs, and aluminum substrates with rapid prototyping turnaround.',
    turnaround: '3-5 business days',
    fields: [
      { name: 'layers', label: 'Number of Layers', type: 'select', options: ['1 Layer', '2 Layers', '4 Layers', '6 Layers'] },
      { name: 'material', label: 'Substrate', type: 'select', options: ['FR4 (Standard)', 'Aluminum', 'Flexible (FPC)', 'Rogers'] },
      { name: 'thickness', label: 'Board Thickness', type: 'select', options: ['0.8mm', '1.0mm', '1.2mm', '1.6mm', '2.0mm'] },
      { name: 'finish', label: 'Surface Finish', type: 'select', options: ['HASL', 'ENIG (Gold)', 'OSP', 'Immersion Tin'] },
      { name: 'soldermask', label: 'Solder Mask Color', type: 'select', options: ['Green', 'Black', 'White', 'Red', 'Blue'] },
      { name: 'quantity', label: 'Quantity (pcs)', type: 'number', placeholder: '5' },
      { name: 'dimensions', label: 'Board Size (mm)', type: 'text', placeholder: 'e.g., 100x80' },
    ],
  },
];

function ServicesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';
  const [selectedService, setSelectedService] = useState<string | null>(initialType || null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState('');

  const service = serviceOptions.find(s => s.id === selectedService);

  const handleSubmit = async () => {
    if (!service || !session) return;
    setSubmitting(true);
    try {
      const fileNames = files.map(f => f.name);
      const res = await fetch('/api/fabrication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${service.name} — ${formData.material || 'Custom'}`,
          serviceType: service.id,
          files: fileNames,
          parameters: formData,
          notes,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setSelectedService(null);
          setFormData({});
          setFiles([]);
          setNotes('');
        }, 3000);
      }
    } catch (e) {
      console.error('Failed to submit service request', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-20 flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
        </motion.div>
        <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase mb-3">Request Submitted</h3>
        <p className="text-[var(--text-muted)] max-w-md">Your service request has been queued. Check your dashboard for updates.</p>
      </div>
    );
  }

  return (
    <>
      {!selectedService ? (
        <>
          {/* Service Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {serviceOptions.map((svc, i) => (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className="h-full border-l-4 border-l-safety-orange cursor-pointer hover:border-l-safety-orange-dark transition-all"
                  onClick={() => setSelectedService(svc.id)}
                >
                  <div className="w-12 h-12 bg-safety-orange/10 flex items-center justify-center rounded-sm mb-4">
                    <svc.icon className="w-6 h-6 text-safety-orange" />
                  </div>
                  <h3 className="text-xl font-black text-[var(--text-on-card)] uppercase mb-3">{svc.name}</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">{svc.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border-secondary)]">
                    <Badge variant="new" className="text-[9px]">{svc.turnaround}</Badge>
                    <Button size="sm" className="text-xs">Get Started</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm">
              <h4 className="text-lg font-black text-[var(--text-primary)] uppercase mb-4">File Guidelines</h4>
              <ul className="space-y-3 text-[var(--text-secondary)] text-sm">
                <li className="flex gap-2"><span className="text-safety-orange">•</span> STL files must be binary format</li>
                <li className="flex gap-2"><span className="text-safety-orange">•</span> DXF units in millimeters</li>
                <li className="flex gap-2"><span className="text-safety-orange">•</span> Gerber files in .ZIP archive</li>
                <li className="flex gap-2"><span className="text-safety-orange">•</span> Max file size: 50MB</li>
              </ul>
            </div>
            <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm">
              <h4 className="text-lg font-black text-[var(--text-primary)] uppercase mb-4">Quality Assurance</h4>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">Every order undergoes manual review by our engineering team before production begins. We will contact you if any issues are detected.</p>
            </div>
            <div className="p-6 bg-safety-orange/10 border border-safety-orange/20 rounded-sm">
              <h4 className="text-lg font-black text-safety-orange uppercase mb-4">Need Help?</h4>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">Our experts can help optimize your design for manufacturing.</p>
              <Button variant="outline" size="sm" onClick={() => window.location.href='/consultation'}>Talk to an Expert</Button>
            </div>
          </div>
        </>
      ) : service ? (
        /* Service Booking Form */
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setSelectedService(null)}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Services</span>
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-safety-orange/10 flex items-center justify-center rounded-sm">
              <service.icon className="w-7 h-7 text-safety-orange" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase">{service.name}</h3>
              <p className="text-xs text-[var(--text-muted)]">Estimated turnaround: {service.turnaround}</p>
            </div>
          </div>

          <Card className="border-2 border-safety-orange/20 overflow-hidden">
            <div className="space-y-5">
              <h4 className="text-sm font-black text-[var(--text-on-card)] uppercase tracking-widest">Service Parameters</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.fields.map(field => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        className="flex h-10 w-full rounded-sm border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-on-card)] focus:outline-none focus:ring-1 focus:ring-safety-orange appearance-none"
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        className="h-10 bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-on-card)] text-sm"
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Design Files</label>
                <div className="border-2 border-dashed border-[var(--border-primary)] rounded-sm p-6 text-center hover:border-safety-orange transition-colors">
                  <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-xs text-[var(--text-muted)] mb-2">Drop files here or click to browse</p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="file-upload"
                    onChange={e => setFiles(Array.from(e.target.files || []))}
                  />
                  <label htmlFor="file-upload">
                    <Button size="sm" variant="outline" className="text-xs cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                      Choose Files
                    </Button>
                  </label>
                  {files.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {files.map((f, i) => (
                        <div key={i} className="text-xs text-[var(--text-secondary)] flex items-center gap-2 justify-center">
                          <span>{f.name}</span>
                          <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Additional Notes</label>
                <Textarea
                  placeholder="Any special requirements, tolerances, or finishing instructions..."
                  className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-on-card)] text-sm min-h-[80px]"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedService(null)}>Cancel</Button>
                <Button
                  className="flex-1 bg-safety-orange hover:bg-safety-orange/80 shadow-[0_4px_0_0_#995400]"
                  onClick={handleSubmit}
                  disabled={submitting || !session}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2"><Activity className="w-4 h-4 animate-spin" /> Submitting...</span>
                  ) : 'Submit Request'}
                </Button>
              </div>
              {!session && (
                <p className="text-xs text-red-500 font-bold text-center">Please sign in to submit a service request.</p>
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}

export default function ServicesPage() {
  return (
    <PageShell>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <SectionHeading
          title="Services"
          annotation="From CAD to Reality"
          dark={true}
        />
        <Suspense fallback={<div className="py-20 flex justify-center"><Activity className="w-8 h-8 text-safety-orange animate-spin" /></div>}>
          <ServicesContent />
        </Suspense>
      </div>
    </PageShell>
  );
}
