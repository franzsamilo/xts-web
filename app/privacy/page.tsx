"use client";

import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 max-w-4xl">
        <SectionHeading title="Privacy Policy" annotation="Your Data" dark={true} />
        
        <div className="prose prose-sm max-w-none text-[var(--text-secondary)] space-y-6">
          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">1. Information We Collect</h3>
            <p className="leading-relaxed">We collect information you provide directly: name, email address, profile information via Google OAuth. We also collect usage data including pages visited, features used, and device information.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">2. How We Use Your Information</h3>
            <p className="leading-relaxed">Your information is used to: provide and improve our services, process orders and fabrication requests, facilitate expert consultations, enable community features, and communicate with you about your account and orders.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">3. Data Storage</h3>
            <p className="leading-relaxed">Your data is stored securely using Google Firebase infrastructure. We implement industry-standard security measures to protect your personal information from unauthorized access.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">4. Data Sharing</h3>
            <p className="leading-relaxed">We do not sell your personal information. We may share your data with: payment processors for transaction processing, experts during consultation sessions (with your consent), and law enforcement when required by law.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">5. Cookies & Tracking</h3>
            <p className="leading-relaxed">We use cookies and similar technologies for authentication, preferences (theme settings), and analytics. You can control cookie settings through your browser preferences.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">6. Your Rights</h3>
            <p className="leading-relaxed">You have the right to: access your personal data, request correction of inaccurate data, request deletion of your account and data, and opt out of non-essential communications.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">7. Contact Us</h3>
            <p className="leading-relaxed">For privacy-related inquiries, contact us at privacy@xtsweb.com or through the support chat feature.</p>
          </section>

          <p className="text-xs text-[var(--text-muted)] pt-8 border-t border-[var(--border-primary)]">
            Last updated: February 2026 | Data Protection Officer: privacy@xtsweb.com
          </p>
        </div>
      </div>
    </PageShell>
  );
}
