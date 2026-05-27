import React from 'react';
import { HeartPulse, CheckCircle2, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function parseSection(text, header) {
  if (!text) return '';
  const parts = text.split(/(?=## )/);
  const found = parts.find(p => p.trim().startsWith(`## ${header}`));
  return found ? found.replace(`## ${header}`, '').trim() : '';
}

function extractActionSteps(text) {
  const lines = text.split('\n');
  return lines
    .filter(l => /^[-*•\d]/.test(l.trim()))
    .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 5);
}

const Skeleton = () => (
  <div className="space-y-2">
    {[100, 90, 80, 95, 85].map((w, i) => (
      <div key={i} className={`h-4 skeleton rounded`} style={{ width: `${w}%` }} />
    ))}
  </div>
);

export default function PhysicalHealthTab({ aiAdvice, keepGoing, loading }) {
  const section = parseSection(aiAdvice, 'Physical Health');
  const steps = extractActionSteps(section);
  const paraLines = section.split('\n').filter(l => !/^[-*•\d]/.test(l.trim()) && l.trim()).join(' ');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <HeartPulse size={20} className="text-teal-600" />
        <h2 className="text-[18px] font-semibold text-slate-900">Physical Health Analysis</h2>
      </div>

      {loading ? (
        <Skeleton />
      ) : section ? (
        <>
          {paraLines && (
            <p className="text-[14px] text-slate-600 leading-relaxed mb-4">{paraLines}</p>
          )}

          {steps.length > 0 && (
            <>
              <p className="text-[14px] font-medium text-slate-600 mb-3">Here are your 5 action steps for the next week:</p>
              <div className="space-y-2.5 mb-5">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-[14px] text-slate-600 leading-snug">{step}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="py-8 text-center">
          <p className="text-slate-400 text-sm">Generate your AI health report to see personalized physical health insights.</p>
        </div>
      )}

      {/* Keep Going banner */}
      {keepGoing && (
        <div className="bg-teal-50 border border-teal-100 rounded-[10px] p-4 flex items-start gap-3">
          <Trophy size={18} className="text-teal-600 shrink-0 mt-0.5" />
          <p className="text-[14px] text-teal-700 leading-relaxed">{keepGoing}</p>
        </div>
      )}
    </div>
  );
}
