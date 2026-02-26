"use client";

import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/ui/SectionHeading';

export default function TermsPage() {
  return (
    <PageShell>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 max-w-4xl">
        <SectionHeading title="Terms of Service" annotation="Legal" dark={true} />
        
        <div className="prose prose-sm max-w-none text-[var(--text-secondary)] space-y-6">
          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">1. Acceptance of Terms</h3>
            <p className="leading-relaxed">By accessing and using XTS WEB (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the Platform.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">2. User Accounts</h3>
            <p className="leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account. You must be at least 18 years old to create an account.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">3. Products & Services</h3>
            <p className="leading-relaxed">All products listed on the Platform are subject to availability. Prices are in Philippine Pesos (PHP) and may change without notice. We reserve the right to refuse or cancel any order at our discretion.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">4. Fabrication Services</h3>
            <p className="leading-relaxed">Custom fabrication services (3D printing, laser cutting, PCB manufacturing) are provided on a best-effort basis. Turnaround times are estimates. XTS WEB is not liable for delays caused by design issues, material availability, or force majeure.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">5. Expert Consultations</h3>
            <p className="leading-relaxed">Expert consultations are advisory in nature. XTS WEB does not guarantee specific outcomes from consultation sessions. All intellectual property shared during sessions remains the property of the respective parties.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">6. Community Guidelines</h3>
            <p className="leading-relaxed">Users must not post content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable. XTS WEB reserves the right to remove content and suspend accounts that violate these guidelines.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">7. Limitation of Liability</h3>
            <p className="leading-relaxed">XTS WEB shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform or any products/services purchased through it.</p>
          </section>

          <section>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase mb-3">8. Changes to Terms</h3>
            <p className="leading-relaxed">We reserve the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms.</p>
          </section>

          <p className="text-xs text-[var(--text-muted)] pt-8 border-t border-[var(--border-primary)]">
            Last updated: February 2026 | Contact: support@xtsweb.com
          </p>
        </div>
      </div>
    </PageShell>
  );
}
