import React from 'react';

export default function StatCard({ title, value, unit, label, icon: Icon, color = 'teal', loading = false }) {
  // Color configuration mapping
  const colorMap = {
    teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
    red: { bg: 'bg-red-50', text: 'text-red-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-500' },
    green: { bg: 'bg-green-50', text: 'text-green-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500' }
  };

  const currentTheme = colorMap[color] || colorMap.teal;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-shimmer h-32 w-full">
        {/* Shimmer loading layout */}
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-gray-250 w-24 rounded"></div>
          <div className="h-8 w-8 rounded-lg bg-gray-250"></div>
        </div>
        <div className="h-8 bg-gray-250 w-32 rounded mb-2"></div>
        <div className="h-3 bg-gray-250 w-16 rounded"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-[36px] leading-none font-bold text-gray-900 tracking-tight">{value !== null && value !== undefined ? value : '--'}</span>
            {unit && <span className="text-[14px] font-medium text-gray-500">{unit}</span>}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${currentTheme.bg} ${currentTheme.text}`}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
      {label && (
        <p className="mt-3 text-xs font-medium text-gray-400 border-t border-gray-50 pt-2">
          {label}
        </p>
      )}
    </div>
  );
}
