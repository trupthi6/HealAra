import React from 'react';
import { Leaf, AlertCircle } from 'lucide-react';

function parseSection(text, header) {
  if (!text) return '';
  const parts = text.split(/(?=## )/);
  const found = parts.find(p => p.trim().startsWith(`## ${header}`));
  return found ? found.replace(`## ${header}`, '').trim() : '';
}

function extractFoodLists(text) {
  const eatLines = [];
  const avoidLines = [];
  const mealTip = [];
  let currentSection = null;
  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('eat more') || lower.includes('foods to eat')) { currentSection = 'eat'; continue; }
    if (lower.includes('reduce') || lower.includes('avoid')) { currentSection = 'avoid'; continue; }
    if (lower.includes('meal timing') || lower.includes('timing tip')) { currentSection = 'tip'; continue; }
    if (/^[-*•]/.test(line.trim())) {
      const clean = line.replace(/^[-*•]+\s*/, '').trim();
      if (clean && currentSection === 'eat') eatLines.push(clean);
      else if (clean && currentSection === 'avoid') avoidLines.push(clean);
      else if (clean && currentSection === 'tip') mealTip.push(clean);
    } else if (currentSection === 'tip' && line.trim() && !/^##/.test(line.trim())) {
      mealTip.push(line.trim());
    }
  }
  return { eat: eatLines.slice(0, 5), avoid: avoidLines.slice(0, 4), tip: mealTip.join(' ') };
}

function FoodCard({ text, type }) {
  const [name, reason] = text.split(/[—–:–](.+)/).filter(Boolean);
  return (
    <div
      className="bg-white border border-slate-200 rounded-lg p-3 mb-2"
      style={{ borderLeft: `3px solid ${type === 'eat' ? '#10B981' : '#EF4444'}` }}
    >
      <p className="text-[13px] font-semibold text-slate-900">{name?.trim()}</p>
      {reason && <p className="text-[12px] text-slate-500 mt-1">{reason.trim()}</p>}
    </div>
  );
}

export default function NutritionGuideTab({ aiAdvice, loading }) {
  const section = parseSection(aiAdvice, 'Nutrition Guide');
  const { eat, avoid, tip } = extractFoodLists(section);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-lg" />)}
      </div>
    );
  }

  if (!section) {
    return (
      <div className="py-8 text-center">
        <Leaf size={32} className="text-slate-200 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">Generate your AI health report to see nutrition insights.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Leaf size={20} className="text-green-500" />
        <h2 className="text-[18px] font-semibold text-slate-900">Nutrition Guide</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Eat more */}
        <div>
          <p className="text-[12px] font-semibold text-green-600 uppercase tracking-wider mb-2">✓ Eat More Of</p>
          {eat.length > 0
            ? eat.map((f, i) => <FoodCard key={i} text={f} type="eat" />)
            : <p className="text-slate-400 text-xs">No data available.</p>}
        </div>
        {/* Avoid */}
        <div>
          <p className="text-[12px] font-semibold text-red-500 uppercase tracking-wider mb-2">✗ Reduce or Avoid</p>
          {avoid.length > 0
            ? avoid.map((f, i) => <FoodCard key={i} text={f} type="avoid" />)
            : <p className="text-slate-400 text-xs">No data available.</p>}
        </div>
      </div>

      {/* Meal Timing Tip */}
      {tip && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-amber-800 leading-relaxed">
            <span className="font-semibold">Meal Timing Tip: </span>{tip}
          </p>
        </div>
      )}
    </div>
  );
}
