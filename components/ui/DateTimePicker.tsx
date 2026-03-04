"use client";

import React from 'react';

interface DateTimePickerProps {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  onStartDateChange: (val: string) => void;
  onStartTimeChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onEndTimeChange: (val: string) => void;
  label?: string;
}

export function DateTimePicker({
  startDate, startTime, endDate, endTime,
  onStartDateChange, onStartTimeChange,
  onEndDateChange, onEndTimeChange,
  label,
}: DateTimePickerProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">
          {label}
        </label>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Start */}
        <div className="space-y-2 p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm">
          <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Start</span>
          <div className="flex gap-2">
            <input
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="flex-1 h-9 rounded-sm border border-[var(--border-primary)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-on-input)] focus:outline-none focus:ring-1 focus:ring-safety-orange"
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-28 h-9 rounded-sm border border-[var(--border-primary)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-on-input)] focus:outline-none focus:ring-1 focus:ring-safety-orange"
            />
          </div>
        </div>

        {/* End */}
        <div className="space-y-2 p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-sm">
          <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">End</span>
          <div className="flex gap-2">
            <input
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="flex-1 h-9 rounded-sm border border-[var(--border-primary)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-on-input)] focus:outline-none focus:ring-1 focus:ring-safety-orange"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-28 h-9 rounded-sm border border-[var(--border-primary)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-on-input)] focus:outline-none focus:ring-1 focus:ring-safety-orange"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
