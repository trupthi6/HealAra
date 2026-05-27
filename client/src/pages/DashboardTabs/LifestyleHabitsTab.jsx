import React from 'react';
import { TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

function parseSection(text, header) {
  if (!text) return '';
  const parts = text.split(/(?=## )/);
  const found = parts.find(p => p.trim().startsWith(`## ${header}`));
  return found ? found.replace(`## ${header}`, '').trim() : '';
}

function extractHabits(text) {
  const build = [];
  const reduce = [];
  let focus = '';
  let currentSection = null;
  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('build these') || lower.includes('build habit')) { currentSection = 'build'; continue; }
    if (lower.includes('habits to reduce') || lower.includes('reduce')) { currentSection = 'reduce'; continue; }
    if (lower.includes("this week's one focus") || lower.includes('one focus')) { currentSection = 'focus'; continue; }
    if (/^[-*•]/.test(line.trim())) {
      const clean = line.replace(/^[-*•]+\s*/, '').replace(/\*\*/g, '').trim();
      if (clean && currentSection === 'build') build.push(clean);
      else if (clean && currentSection === 'reduce') reduce.push(clean);
    } else if (currentSection === 'focus' && line.trim() && !/^##/.test(line)) {
      focus += line.replace(/\*\*/g, '').trim() + ' ';
    }
  }
  return { build, reduce, focus: focus.trim() };
}

export default function LifestyleHabitsTab({ aiAdvice, loading }) {
  const section = parseSection(aiAdvice, 'Lifestyle');
  const { build, reduce, focus } = extractHabits(section);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-12 skeleton rounded-lg" />)}
      </div>
    );
  }

  if (!section) {
    return (
      <div className="py-8 text-center">
        <TrendingUp size={32} className="text-slate-200 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">Generate your AI health report to see lifestyle insights.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-teal-600" />
        <h2 className="text-[18px] font-semibold text-slate-900">Lifestyle & Habits</h2>
      </div>

      {build.length > 0 && (
        <div className="mb-4">
          <p className="text-[12px] font-semibold text-green-600 uppercase tracking-wider mb-2">Build These Habits</p>
          <div className="space-y-2">
            {build.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={17} className="text-green-500 shrink-0 mt-0.5" />
                <p className="text-[14px] text-slate-600 leading-snug">{h}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {reduce.length > 0 && (
        <div className="mb-4">
          <p className="text-[12px] font-semibold text-amber-600 uppercase tracking-wider mb-2">Habits to Reduce</p>
          <div className="space-y-2">
            {reduce.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <AlertTriangle size={17} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[14px] text-slate-600 leading-snug">{h}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {focus && (
        <div className="bg-teal-600 rounded-[10px] p-4">
          <p className="text-[12px] font-semibold text-teal-100 uppercase tracking-wider mb-1">This Week's One Focus</p>
          <p className="text-[14px] font-medium text-white leading-relaxed">{focus}</p>
        </div>
      )}
    </div>
  );
}
