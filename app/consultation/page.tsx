"use client";

import React, { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock, Star, Video, MessageSquare, ShieldCheck } from 'lucide-react';

const experts = [
  {
    id: 1,
    name: 'Dr. Aris Varma',
    title: 'Senior CAD & Mechanical Systems',
    bio: 'Specializing in complex assembly design for aerospace and high-precision robotics. Expert in SolidWorks and Fusion 360.',
    rating: 4.9,
    reviews: 124,
    price: '$85/hr',
    tags: ['CAD Design', 'FEA Analysis', '3D Printing'],
    availability: 'Next: Today 4:00 PM'
  },
  {
    id: 2,
    name: 'Sarah Zhang',
    title: 'Embedded Systems & PCB Design',
    bio: 'Hardware architect for IoT and industrial systems. Expert at Altium, KiCad, and firmware optimization for low-power devices.',
    rating: 5.0,
    reviews: 89,
    price: '$75/hr',
    tags: ['PCB Design', 'Firmware', 'IoT'],
    availability: 'Next: Monday 9:00 AM'
  },
  {
    id: 3,
    name: 'Marcus Thorne',
    title: 'Robotics Control & Logic',
    bio: 'Focused on sensor fusion, PID tuning, and autonomous navigation. Expert in ROS2, Python, and C++ for real-time systems.',
    rating: 4.8,
    reviews: 56,
    price: '$90/hr',
    tags: ['ROS2', 'Logic', 'Sensors'],
    availability: 'Next: Tomorrow 2:00 PM'
  }
];

export default function ConsultationPage() {
  const [selectedExpert, setSelectedExpert] = useState<number | null>(null);

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-20">
        <SectionHeading 
          title="Expert Access" 
          annotation="Unblock your Project" 
          dark={true}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-8">
            {experts.map((expert) => (
              <Card 
                key={expert.id} 
                className={`relative group transition-all cursor-pointer ${selectedExpert === expert.id ? 'border-2 border-safety-orange' : ''}`}
                onClick={() => setSelectedExpert(expert.id)}
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-32 h-40 bg-zinc-200 rounded-sm shrink-0 flex items-center justify-center relative overflow-hidden group">
                     {/* Placeholder for Expert Avatar */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                     <User className="w-16 h-16 text-zinc-400" />
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-2xl font-black text-esd-dark uppercase leading-none mb-1 group-hover:text-safety-orange transition-colors">
                          {expert.name}
                        </h3>
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-tight">{expert.title}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-safety-orange font-black text-xl leading-none">
                          <Star className="w-4 h-4 fill-current" />
                          {expert.rating}
                        </div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase">{expert.reviews} Reviews</p>
                      </div>
                    </div>

                    <p className="text-zinc-600 mb-6 leading-relaxed line-clamp-2">
                      {expert.bio}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {expert.tags.map(tag => (
                        <Badge key={tag} variant="pending" className="bg-zinc-100 border-none lowercase font-medium">#{tag}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-black/5">
                       <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs">
                          <Clock className="w-4 h-4" />
                          {expert.availability}
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-xl font-black text-esd-dark">{expert.price}</span>
                          <Button 
                            size="sm"
                            className="bg-safety-orange hover:bg-safety-orange/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Booking request for ${expert.name} transmitted. Your session will appear in the dashboard once confirmed.`);
                            }}
                          >
                            Book Now
                          </Button>
                       </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <div className="p-8 bg-zinc-900 border border-white/5 rounded-sm shadow-2xl">
              <h4 className="text-lg font-black text-white uppercase mb-6 tracking-tighter">How it Works</h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-sm bg-safety-orange/10 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-safety-orange" />
                  </div>
                  <div>
                    <h5 className="text-white font-bold text-sm uppercase">1:1 Video Session</h5>
                    <p className="text-xs text-zinc-400 mt-1">Direct screen-sharing and technical walkthrough.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-sm bg-safety-orange/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-safety-orange" />
                  </div>
                  <div>
                    <h5 className="text-white font-bold text-sm uppercase">Quick Support</h5>
                    <p className="text-xs text-zinc-400 mt-1">Ongoing text consultation after your session.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-sm bg-safety-orange/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-safety-orange" />
                  </div>
                  <div>
                    <h5 className="text-white font-bold text-sm uppercase">NDAs Covered</h5>
                    <p className="text-xs text-zinc-400 mt-1">Standard confidential agreements included.</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-10">View Policy</Button>
            </div>

            <div className="p-8 bg-zinc-800/50 border border-white/5 rounded-sm">
                <h4 className="text-lg font-black text-white uppercase mb-4 tracking-tighter">Verified Skills</h4>
                <div className="flex flex-wrap gap-2 opacity-50">
                  {['Autodesk', 'SolidWorks', 'ROS2', 'STM32', 'Arduino', 'Python', 'C++', 'CAD', 'CAM'].map(skill => (
                    <span key={skill} className="px-2 py-1 bg-zinc-700 text-[10px] font-bold text-white rounded-sm">{skill}</span>
                  ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

const User = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
