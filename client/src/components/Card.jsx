import React from 'react';

export default function Card({ children, className = '', level = 1, hoverEffect = true }) {
  const surfaceClass = level === 2 
    ? 'bg-surface-l2 rounded-xl' 
    : level === 'elevated' 
      ? 'bg-surface-elevated rounded-xl'
      : 'bg-surface-l1 rounded-xl';
  
  const hoverClass = hoverEffect && level === 1
    ? 'transition-premium hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] hover:-translate-y-[1px]'
    : '';

  return (
    <div className={`${surfaceClass} ${hoverClass} p-6 ${className}`}>
      {children}
    </div>
  );
}
