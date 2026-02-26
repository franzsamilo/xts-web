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
      { name: '3D Printing', href: '/services?type=3d-printing' },
      { name: 'Laser Cutting', href: '/services?type=laser-cutting' },
      { name: 'PCB Fab', href: '/services?type=pcb-fabrication' },
      { name: 'Expert Consultation', href: '/consultation' },
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
    <footer className="bg-[var(--footer-bg)] pt-16 sm:pt-20 pb-8 sm:pb-10 border-t border-[var(--border-primary)]">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-12 sm:mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 sm:mb-6">
              <XTSLogo className="w-8 h-8" />
              <span className="text-xl font-black text-white">XTS WEB</span>
            </Link>
            <p className="text-zinc-500 max-w-sm mb-6 sm:mb-8 text-sm">
              The ultimate workbench for engineers. High-quality parts, specialized fabrication, and an expert community to bring your projects to life.
            </p>
            <div className="flex gap-3">
              {['X', 'GH', 'IN', 'YT'].map(label => (
                <div key={label} className="w-9 h-9 rounded-sm bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-safety-orange hover:text-white transition-colors cursor-pointer text-[10px] font-black">
                  {label}
                </div>
              ))}
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-bold uppercase tracking-tight mb-4 sm:mb-6 text-sm">{section.title}</h4>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-zinc-500 hover:text-safety-orange transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <p className="text-zinc-600 text-xs sm:text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()} XTS WEB. Designed for the Engineering Desk.
          </p>
          <div className="flex gap-4 sm:gap-8 text-xs sm:text-sm text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
