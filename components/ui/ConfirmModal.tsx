"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  variant?: 'danger' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = 'Confirm',
  message,
  variant = 'info',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onCancel}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-sm shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Top accent bar */}
            <div className={`h-1 w-full ${isDanger ? 'bg-red-500' : 'bg-safety-orange'}`} />

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-500/10' : 'bg-safety-orange/10'}`}>
                  {isDanger ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Info className="w-5 h-5 text-safety-orange" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-[var(--text-on-card)] uppercase tracking-wide mb-1">{title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{message}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onCancel}>
                  {cancelLabel}
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 text-xs ${isDanger ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_2px_0_0_#991b1b]' : ''}`}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
