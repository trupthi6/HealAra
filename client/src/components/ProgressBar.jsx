import React from 'react';

export default function ProgressBar({ value = 0, max = 100, color = '#0D9488', label }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mt-3">
      <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {label && (
        <p className="text-[11px] text-slate-400 mt-1">{label}</p>
      )}
    </div>
  );
}
