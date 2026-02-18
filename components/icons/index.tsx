import React from 'react';

export const XTSLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path d="M20 20L80 80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    <path d="M80 20L20 80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    <circle cx="50" cy="50" r="15" fill="var(--color-safety-orange)" />
    <path d="M10 50H25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M75 50H90" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M50 10V25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M50 75V90" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const FabricationIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 8V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
    <path d="M16 2v4a2 2 0 0 0 2 2h3" />
    <path d="M3 8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" />
    <path d="M10 12h4" />
    <path d="M10 16h4" />
  </svg>
);

export const ConsultationIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="10" r="2" />
  </svg>
);

export const CommunityIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const ShopIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export const UploadIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="M16 16l-4-4-4 4" />
  </svg>
);

export const DashboardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 12L16 10" />
    <path d="M12 7V12" />
  </svg>
);
