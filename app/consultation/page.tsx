"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { Calendar, Clock, Star, Video, MessageSquare, ShieldCheck, X, CheckCircle2, Activity, FileText, Cpu, PenTool, Wrench, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';

const consultationOptions = [
  {
    id: 'cad-review',
    name: 'CAD & Design Review',
    icon: PenTool,
    description: 'Get expert feedback on your mechanical designs, assembly layouts, and manufacturing feasibility. Supports SolidWorks, Fusion 360, and AutoCAD.',
    price: 'From PHP 2,500/session',
  },
  {
    id: 'firmware-debug',
    name: 'Firmware & Code Debug',
    icon: Cpu,
    description: 'Debug embedded systems, optimize firmware performance, and resolve hardware-software integration issues. Covers Arduino, STM32, ESP32, and ROS.',
    price: 'From PHP 2,000/session',
  },
  {
    id: 'hardware-design',
    name: 'Hardware & PCB Design',
    icon: Wrench,
    description: 'Circuit design consultation, PCB layout optimization, component selection, and signal integrity analysis using Altium and KiCad.',
    price: 'From PHP 3,000/session',
  },
  {
    id: 'general',
    name: 'General Engineering',
    icon: FileText,
    description: 'Broad technical consultation for project planning, feasibility studies, material selection, and manufacturing process optimization.',
    price: 'From PHP 1,500/session',
  },
];

export default function ConsultationPage() {
  const { data: session } = useSession();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    specialty: '',
    projectDescription: '',
    requiredSkills: '',
    budget: '',
    timeline: '',
    attachments: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      const option = consultationOptions.find(o => o.id === selectedOption);
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertName: 'Pending Assignment',
          expertTitle: option?.name || formData.specialty,
          expertPrice: option?.price || formData.budget,
          slot: formData.timeline || 'TBD',
          consultationType: selectedOption,
          projectDescription: formData.projectDescription,
          requiredSkills: formData.requiredSkills,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setSelectedOption(null);
          setFormData({ specialty: '', projectDescription: '', requiredSkills: '', budget: '', timeline: '', attachments: '' });
        }, 3000);
      }
    } catch (e) {
      console.error('Consultation request failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <SectionHeading
          title="Expert Consultation"
          annotation="Unblock your Project"
          dark={true}
        />

        {submitted ? (
          <div className="py-20 flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
            </motion.div>
            <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase mb-3">Request Submitted</h3>
            <p className="text-[var(--text-muted)] max-w-md">An expert will be matched to your request. Check your dashboard for updates.</p>
          </div>
        ) : !selectedOption ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Consultation Options */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase mb-6">Choose a Consultation Type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {consultationOptions.map((option, i) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card
                      className="h-full cursor-pointer group transition-all hover:border-safety-orange"
                      onClick={() => setSelectedOption(option.id)}
                    >
                      <div className="w-10 h-10 bg-safety-orange/10 flex items-center justify-center rounded-sm mb-4 group-hover:bg-safety-orange group-hover:scale-110 transition-all">
                        <option.icon className="w-5 h-5 text-safety-orange group-hover:text-white" />
                      </div>
                      <h4 className="text-lg font-black text-[var(--text-on-card)] uppercase mb-2">{option.name}</h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">{option.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-secondary)]">
                        <span className="text-sm font-black text-safety-orange">{option.price}</span>
                        <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-safety-orange group-hover:translate-x-1 transition-all" />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm">
                <h4 className="text-lg font-black text-[var(--text-primary)] uppercase mb-4 tracking-tighter">How it Works</h4>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-sm bg-safety-orange/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-safety-orange" />
                    </div>
                    <div>
                      <h5 className="text-[var(--text-primary)] font-bold text-sm uppercase">1. Submit Request</h5>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Fill out what you need help with.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-sm bg-safety-orange/10 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-safety-orange" />
                    </div>
                    <div>
                      <h5 className="text-[var(--text-primary)] font-bold text-sm uppercase">2. Expert Match</h5>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">We match you with the right specialist.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-sm bg-safety-orange/10 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-safety-orange" />
                    </div>
                    <div>
                      <h5 className="text-[var(--text-primary)] font-bold text-sm uppercase">3. Session</h5>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">1:1 video or chat consultation.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm">
                <h4 className="text-lg font-black text-[var(--text-primary)] uppercase mb-4 tracking-tighter">Guarantees</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <ShieldCheck className="w-4 h-4 text-safety-orange shrink-0" /> NDA coverage included
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Clock className="w-4 h-4 text-safety-orange shrink-0" /> Response within 24 hours
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <MessageSquare className="w-4 h-4 text-safety-orange shrink-0" /> Follow-up support
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Application Form */
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setSelectedOption(null)}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-8 transition-colors group"
            >
              <X className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Back to Options</span>
            </button>

            <Card className="border-2 border-safety-orange/20">
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const opt = consultationOptions.find(o => o.id === selectedOption);
                    const Icon = opt?.icon || FileText;
                    return (
                      <>
                        <div className="w-10 h-10 bg-safety-orange/10 flex items-center justify-center rounded-sm">
                          <Icon className="w-5 h-5 text-safety-orange" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-[var(--text-on-card)] uppercase">{opt?.name}</h3>
                          <p className="text-xs text-[var(--text-muted)]">{opt?.price}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Specific Specialty Needed</label>
                  <Input
                    placeholder="e.g., ROS2 navigation, PCB power design, servo tuning"
                    className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-on-input)] text-sm h-10"
                    value={formData.specialty}
                    onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Project Description</label>
                  <Textarea
                    placeholder="Describe your project, the specific problem you're facing, and what outcome you expect from the consultation..."
                    className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-on-input)] text-sm min-h-[100px]"
                    value={formData.projectDescription}
                    onChange={e => setFormData({ ...formData, projectDescription: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Required Skills / Tools</label>
                    <Input
                      placeholder="e.g., KiCad, SolidWorks, C++"
                      className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-on-input)] text-sm h-10"
                      value={formData.requiredSkills}
                      onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Budget Range</label>
                    <Input
                      placeholder="e.g., PHP 2,000 - 5,000"
                      className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-on-input)] text-sm h-10"
                      value={formData.budget}
                      onChange={e => setFormData({ ...formData, budget: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Preferred Timeline</label>
                  <Input
                    placeholder="e.g., Within this week, ASAP, Flexible"
                    className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-on-input)] text-sm h-10"
                    value={formData.timeline}
                    onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedOption(null)}>Cancel</Button>
                  <Button
                    className="flex-1 bg-safety-orange hover:bg-safety-orange/80 shadow-[0_4px_0_0_#995400]"
                    onClick={handleSubmit}
                    disabled={submitting || !session}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2"><Activity className="w-4 h-4 animate-spin" /> Submitting...</span>
                    ) : 'Submit Consultation Request'}
                  </Button>
                </div>
                {!session && (
                  <p className="text-xs text-red-500 font-bold text-center">Sign in to submit a consultation request.</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
