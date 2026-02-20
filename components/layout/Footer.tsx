import React from 'react';
import Link from 'next/link';
import { XTSLogo } from '@/components/icons';

const footerLinks = [
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { name: '3D Printing', href: '/fabrication#3d' },
      { name: 'Laser Cutting', href: '/fabrication#laser' },
      { name: 'PCB Fab', href: '/fabrication#pcb' },
      { name: 'CAD Design', href: '/consultation' },
    ],
  },
  {
    title: 'Support',
    links: [
      { name: 'Order Status', href: '/dashboard' },
      { name: 'Shipping Policy', href: '/shipping' },
      { name: 'Returns', href: '/returns' },
      { name: 'FAQ', href: '/faq' },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="bg-esd-darker pt-20 pb-10 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <XTSLogo className="w-8 h-8" />
              <span className="text-xl font-black text-white">XTS WEB</span>
            </Link>
            <p className="text-zinc-500 max-w-sm mb-8">
              The ultimate workbench for engineers. High-quality parts, specialized fabrication, and an expert community to bring your projects to life.
            </p>
            <div className="flex gap-4">
              {/* Social icons */}
              {['X', 'GH', 'IN', 'YT'].map(label => (
                <div key={label} className="w-10 h-10 rounded-sm bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-safety-orange hover:text-white transition-colors cursor-pointer text-[10px] font-black">
                  {label}
                </div>
              ))}
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-bold uppercase tracking-tight mb-6">{section.title}</h4>
              <ul className="flex flex-col gap-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-zinc-500 hover:text-safety-orange transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-600 text-sm">
            &copy; {new Date().getFullYear()} XTS WEB. Designed for the Engineering Desk.
          </p>
          <div className="flex gap-8 text-sm text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-400">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
