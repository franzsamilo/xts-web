"use client";

import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { Store, Globe, Package, Truck } from 'lucide-react';

export default function ApplySellerPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    companyName: '',
    website: '',
    inventoryType: '',
    logistics: ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          expertise: `Seller: ${formData.inventoryType} - ${formData.website}`,
          description: formData.logistics,
          type: 'seller'
        })
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (e) {
      console.error("Seller application failed", e);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-20 h-20 bg-blue-600/10 border border-blue-600/20 rounded-sm flex items-center justify-center mb-8 rotate-45">
            <Store className="w-10 h-10 text-blue-600 -rotate-45" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Storefront Request Logged</h2>
          <p className="text-zinc-500 max-w-md font-medium uppercase text-xs tracking-widest leading-loose">
            Your vendor application is under review. Please allow 3-5 business days for our procurement team to validate your inventory sources.
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
          title="Become a Verified Vendor" 
          annotation="Supply Chain Integration"
          dark={true}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Feature icon={Globe} title="Global Reach" description="Sell your hardware to engineers worldwide." />
          <Feature icon={Package} title="Inventory Mgmt" description="Use our tools to track your stock." />
          <Feature icon={Truck} title="Logistics Support" description="We handle the shipping labels." />
        </div>

        <Card className="border-2 border-blue-600/20 overflow-hidden bg-zinc-900/50">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Company / Brand Name</label>
                <Input 
                  placeholder="XTS Hardware Co." 
                  className="bg-black/50 border-zinc-800 text-white" 
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Website / Portfolio</label>
                <Input 
                  placeholder="https://..." 
                  className="bg-black/50 border-zinc-800 text-white" 
                  value={formData.website}
                  onChange={e => setFormData({...formData, website: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Inventory Category</label>
              <Input 
                  placeholder="Motors, Sensors, Controllers..." 
                  className="bg-black/50 border-zinc-800 text-white" 
                  value={formData.inventoryType}
                  onChange={e => setFormData({...formData, inventoryType: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Logistics Capabilities</label>
              <Textarea 
                placeholder="Describe your shipping capacity, warehouse location, and return policies..." 
                className="bg-black/50 border-zinc-800 text-white min-h-[100px]" 
                value={formData.logistics}
                onChange={e => setFormData({...formData, logistics: e.target.value})}
              />
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Badge variant="in-progress" className="bg-blue-600/20 text-blue-500 border-blue-600/50">VENDOR REVIEW</Badge>
                <span className="text-xs text-zinc-400 font-medium italic">Processing time: 3-5 days</span>
              </div>
              <Button 
                className="w-full md:w-auto px-12 h-14 text-lg bg-blue-600 hover:bg-blue-500 shadow-[0_4px_0_0_#1e3a8a]"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Register Store'}
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
    <div className="w-12 h-12 bg-blue-600/10 rounded-sm flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
    <h4 className="text-white font-black uppercase text-xs tracking-widest mb-2">{title}</h4>
    <p className="text-zinc-500 text-[10px] leading-relaxed uppercase">{description}</p>
  </div>
);
