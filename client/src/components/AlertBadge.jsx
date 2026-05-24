import React from 'react';

export default function AlertBadge({ severity }) {
  const styles = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-green-50 text-green-700 border-green-200'
  };

  const labels = {
    critical: 'Critical',
    warning: 'Warning',
    resolved: 'Resolved'
  };

  const currentStyle = styles[severity] || styles.warning;
  const currentLabel = labels[severity] || severity;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}>
      {currentLabel}
    </span>
  );
}
