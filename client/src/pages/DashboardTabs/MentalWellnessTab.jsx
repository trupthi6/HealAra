import React from 'react';
import { Brain, CheckCircle2, Smile } from 'lucide-react';

function parseSection(text, header) {
  if (!text) return '';
  const parts = text.split(/(?=## )/);
  const found = parts.find(p => p.trim().startsWith(`## ${header}`));
  return found ? found.replace(`## ${header}`, '').trim() : '';
}

function extractActionSteps(text) {
  const lines = text.split('\n');
  return lines
    .filter(l => /^[-*•]/.test(l.trim()))
    .map(l => l.replace(/^[-*•]+\s*/, '').trim())
    .filter(Boolean);
}

const Skeleton = () => (
  <div className="space-y-2">
    {[100, 90, 80].map((w, i) => (
      <div key={i} className="h-4 skeleton rounded" style={{ width: `${w}%` }} />
    ))}
  </div>
);

export default function MentalWellnessTab({ aiAdvice, loading }) {
  const section = parseSection(aiAdvice, 'Mental Wellness');
  const steps = extractActionSteps(section);
  const paraLines = section.split('\n').filter(l => !/^[-*•]/.test(l.trim()) && l.trim()).join(' ');

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Brain size={20} className="text-purple-500" />
        <h2 className="text-[18px] font-semibold text-slate-900">Mental Wellness Analysis</h2>
      </div>

      {loading ? <Skeleton /> : section ? (
        <>
          {paraLines && (
            <p className="text-[14px] text-slate-600 leading-relaxed mb-4">{paraLines}</p>
          )}
          {steps.length > 0 && (
            <div className="space-y-2.5 mb-5">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-[14px] text-slate-600 leading-snug">{step}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-purple-50 border border-purple-100 rounded-[10px] p-4 flex items-start gap-3">
            <Smile size={18} className="text-purple-500 shrink-0 mt-0.5" />
            <p className="text-[14px] text-purple-700 leading-relaxed">Small acts of self-care compound into powerful mental resilience. Keep prioritising your wellbeing.</p>
          </div>
        </>
      ) : (
        <div className="py-8 text-center">
          <p className="text-slate-400 text-sm">Generate your AI health report to see mental wellness insights.</p>
        </div>
      )}
    </div>
  );
}
