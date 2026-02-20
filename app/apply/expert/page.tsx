"use client";

import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { PenTool, Brain, Calendar, Award } from 'lucide-react';

export default function ApplyExpertPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    discipline: '',
    expertise: ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          expertise: `${formData.discipline} - ${formData.expertise}`,
          type: 'expert'
        })
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (e) {
      console.error("Application failed", e);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-20 h-20 bg-green-600/10 border border-green-600/20 rounded-sm flex items-center justify-center mb-8 rotate-45">
            <Award className="w-10 h-10 text-green-600 -rotate-45" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Application Transmitted</h2>
          <p className="text-zinc-500 max-w-md font-medium uppercase text-xs tracking-widest leading-loose">
            Your technical dossier has been received and queued for manual verification. 
            A senior engineer will review your credentials within 72 hours.
          </p>
          <Button variant="outline" className="mt-12" onClick={() => window.location.href='/dashboard'}>Return to Dashboard</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <SectionHeading 
          title="Join the Expert Roster" 
          annotation="Technical Consultation"
          dark={true}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Feature icon={Brain} title="Share Intelligence" description="Help engineers solve complex problems." />
          <Feature icon={Calendar} title="Flexible Schedule" description="Set your own hours and booking rates." />
          <Feature icon={Award} title="Verified Badge" description="Gain prestige as an official XTS Expert." />
        </div>

        <Card className="border-2 border-safety-orange/20 overflow-hidden bg-zinc-900/50">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Full Legal Name</label>
                <Input 
                  placeholder="Engineering Lead" 
                  className="bg-black/50 border-zinc-800 text-white" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Primary Discipline</label>
                <Input 
                  placeholder="Mechatronics / Aerospace" 
                  className="bg-black/50 border-zinc-800 text-white" 
                  value={formData.discipline}
                  onChange={e => setFormData({...formData, discipline: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Certifications & Experience</label>
              <Textarea 
                placeholder="List your professional background, degrees, and specific hardware expertise (e.g. ROS2, CNC, PLC)..." 
                className="bg-black/50 border-zinc-800 text-white min-h-[150px]" 
                value={formData.expertise}
                onChange={e => setFormData({...formData, expertise: e.target.value})}
              />
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Badge variant="in-progress">TECHNICAL REVIEW</Badge>
                <span className="text-xs text-zinc-400 font-medium italic">Estimated interview booking: 1 week</span>
              </div>
              <Button 
                className="w-full md:w-auto px-12 h-14 text-lg bg-safety-orange hover:bg-safety-orange/80"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Transmitting...' : 'Apply to Consult'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

const Feature = ({ icon: Icon, title, description }: any) => (
  <div className="flex flex-col items-center text-center p-6 bg-zinc-900 border border-white/5 rounded-sm">
    <div className="w-12 h-12 bg-safety-orange/10 rounded-sm flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-safety-orange" />
    </div>
    <h4 className="text-white font-black uppercase text-xs tracking-widest mb-2">{title}</h4>
    <p className="text-zinc-500 text-[10px] leading-relaxed uppercase">{description}</p>
  </div>
);
