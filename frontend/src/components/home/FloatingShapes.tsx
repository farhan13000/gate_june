import React from 'react';
import './FloatingShapes.css';

const WireframeCube = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" />
    <polyline points="50,10 50,50 90,30" />
    <polyline points="10,30 50,50 50,90" />
    <line x1="10" y1="70" x2="90" y2="70" strokeDasharray="2 4" opacity="0.4" />
    <line x1="50" y1="90" x2="50" y2="10" strokeDasharray="2 4" opacity="0.4" />
  </svg>
);

const WireframeSphere = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="50" cy="50" r="40" />
    <ellipse cx="50" cy="50" rx="40" ry="15" />
    <ellipse cx="50" cy="50" rx="15" ry="40" />
    <path d="M 22 22 Q 50 50 78 78" strokeDasharray="2 4" opacity="0.4" />
    <path d="M 22 78 Q 50 50 78 22" strokeDasharray="2 4" opacity="0.4" />
  </svg>
);

const WireframePyramid = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="50,10 15,80 85,80" />
    <line x1="50" y1="10" x2="50" y2="80" />
    <line x1="15" y1="80" x2="50" y2="65" strokeDasharray="2 4" opacity="0.4" />
    <line x1="85" y1="80" x2="50" y2="65" strokeDasharray="2 4" opacity="0.4" />
    <line x1="50" y1="10" x2="50" y2="65" strokeDasharray="2 4" opacity="0.4" />
  </svg>
);

const WireframeCylinder = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="50" cy="20" rx="30" ry="10" />
    <ellipse cx="50" cy="80" rx="30" ry="10" />
    <line x1="20" y1="20" x2="20" y2="80" />
    <line x1="80" y1="20" x2="80" y2="80" />
    <path d="M 20 80 A 30 10 0 0 0 80 80" />
    <path d="M 20 80 A 30 10 0 0 1 80 80" strokeDasharray="2 4" opacity="0.4" />
  </svg>
);

const WireframeTorus = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="50" cy="50" rx="45" ry="25" />
    <ellipse cx="50" cy="50" rx="20" ry="10" />
    <path d="M 5 50 Q 50 100 95 50" strokeDasharray="2 4" opacity="0.4" />
  </svg>
);

export default function FloatingShapes() {
  return (
    <div className="floating-shapes-container">
      <WireframeCube className="floating-shape" />
      <WireframeSphere className="floating-shape" />
      <WireframePyramid className="floating-shape" />
      <WireframeCylinder className="floating-shape" />
      <WireframeTorus className="floating-shape" />
      
      <WireframeCube className="floating-shape" />
      <WireframePyramid className="floating-shape" />
      <WireframeSphere className="floating-shape" />
      <WireframeCylinder className="floating-shape" />
      <WireframeTorus className="floating-shape" />
      
      <WireframeCube className="floating-shape" />
      <WireframePyramid className="floating-shape" />
    </div>
  );
}
