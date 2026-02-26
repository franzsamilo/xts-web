"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, FileText, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export const TermsModal = () => {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) return;
    // Check if user has accepted terms
    const checkTerms = async () => {
      try {
        const res = await fetch('/api/users/terms');
        if (res.ok) {
          const data = await res.json();
          if (!data.accepted) {
            setShow(true);
          }
        }
      } catch {
        // If API fails, don't block the user
      }
    };
    checkTerms();
  }, [session?.user?.email]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await fetch('/api/users/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setShow(false);
    } catch (e) {
      console.error('Failed to accept terms', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-sm shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden"
          >
            <div className="bg-safety-orange p-0.5">
              <div className="bg-[var(--bg-secondary)] p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-6 h-6 text-safety-orange" />
                  <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Welcome to XTS WEB</h3>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Please review and accept our terms to continue</p>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-safety-orange" />
                  <h4 className="font-bold text-[var(--text-primary)] text-sm uppercase">Terms of Service</h4>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                  By using XTS WEB, you agree to our terms including: proper use of the platform, respect for community guidelines, 
                  acceptance of our order and fabrication service policies, and understanding that expert consultations are advisory.
                </p>
                <Link href="/terms" target="_blank" className="text-xs text-safety-orange font-bold hover:underline">
                  Read Full Terms →
                </Link>
              </div>

              <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-safety-orange" />
                  <h4 className="font-bold text-[var(--text-primary)] text-sm uppercase">Privacy Policy</h4>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                  We collect your name and email via Google OAuth for account management. Your data is stored securely using Firebase 
                  infrastructure. We do not sell personal information to third parties.
                </p>
                <Link href="/privacy" target="_blank" className="text-xs text-safety-orange font-bold hover:underline">
                  Read Full Privacy Policy →
                </Link>
              </div>
            </div>

            <div className="p-6 pt-3 border-t border-[var(--border-primary)]">
              <label className="flex items-start gap-3 cursor-pointer mb-4" onClick={() => setAccepted(!accepted)}>
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={() => setAccepted(!accepted)}
                  className="mt-1 w-4 h-4 accent-safety-orange cursor-pointer"
                />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  I have read and agree to the <strong className="text-[var(--text-primary)]">Terms of Service</strong> and{' '}
                  <strong className="text-[var(--text-primary)]">Privacy Policy</strong>.
                </span>
              </label>
              <Button
                className="w-full h-12 bg-safety-orange hover:bg-safety-orange/80 shadow-[0_4px_0_0_#995400]"
                disabled={!accepted || loading}
                onClick={handleAccept}
              >
                {loading ? 'Processing...' : 'Accept & Continue'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
