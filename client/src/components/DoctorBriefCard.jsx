import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  FileX,
  User,
  Activity,
  Heart,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  MessageSquare,
  Save,
  Loader2
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */
const getAge = (dobString) => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  const diff = Date.now() - birthDate.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const fmtShort = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

const fmtDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const URGENCY_BADGE = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  scheduled: 'bg-orange-50 text-orange-700 border-orange-200',
  none: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const URGENCY_LABEL = {
  urgent: 'Urgent',
  scheduled: 'Scheduled',
  none: 'No Immediate Action',
};

/* ──────────────────────────────────────────────
   Brief parser — extract structured sections
   ────────────────────────────────────────────── */
function parseBriefSections(text) {
  if (!text) return { riskFlags: [], nutrition: [], lifestyle: [], raw: '' };

  const parseList = (section) => {
    if (!section) return [];
    return section
      .split('\n')
      .filter((l) => /^[-*•]/.test(l.trim()))
      .map((l) => {
        const clean = l.replace(/^[-*•]\s*/, '').trim();
        const sepIdx = clean.search(/[—–:-]/);
        if (sepIdx > 0) {
          return { title: clean.slice(0, sepIdx).trim(), reason: clean.slice(sepIdx + 1).trim() };
        }
        return { title: clean, reason: '' };
      })
      .filter((i) => i.title);
  };

  const match = (pattern) => {
    const m = text.match(pattern);
    return m ? m[0] : null;
  };

  const riskSection = text.match(/##\s*Risk Flags[\s\S]*?(?=##|$)/i)?.[0];
  const nutritionSection = text.match(/##\s*Nutrition Prescriptions[\s\S]*?(?=##|$)/i)?.[0];
  const lifestyleSection = text.match(/##\s*Lifestyle Prescriptions[\s\S]*?(?=##|$)/i)?.[0];

  return {
    riskFlags: parseList(riskSection),
    nutrition: parseList(nutritionSection),
    lifestyle: parseList(lifestyleSection),
    raw: text,
  };
}

/* ──────────────────────────────────────────────
   Sub-component: VitalsTable
   ────────────────────────────────────────────── */
function VitalsTable({ weekSummary }) {
  if (!weekSummary) return null;

  const rows = [
    {
      metric: 'Glucose',
      avg: weekSummary.avgGlucose ? `${weekSummary.avgGlucose} mg/dL` : '—',
      threshold: weekSummary.thresholds?.glucoseMax ? `${weekSummary.thresholds.glucoseMax} mg/dL` : '180 mg/dL',
      status: weekSummary.avgGlucose && weekSummary.thresholds?.glucoseMax
        ? weekSummary.avgGlucose > weekSummary.thresholds.glucoseMax ? 'high' : 'normal'
        : null,
    },
    {
      metric: 'Blood Pressure',
      avg:
        weekSummary.avgBpSystolic && weekSummary.avgBpDiastolic
          ? `${weekSummary.avgBpSystolic}/${weekSummary.avgBpDiastolic} mmHg`
          : '—',
      threshold: weekSummary.thresholds?.bpSystolicMax
        ? `${weekSummary.thresholds.bpSystolicMax}/90 mmHg`
        : '140/90 mmHg',
      status: weekSummary.avgBpSystolic && weekSummary.thresholds?.bpSystolicMax
        ? weekSummary.avgBpSystolic > weekSummary.thresholds.bpSystolicMax ? 'high' : 'normal'
        : null,
    },
    {
      metric: 'Heart Rate',
      avg: weekSummary.avgHeartRate ? `${weekSummary.avgHeartRate} bpm` : '—',
      threshold: weekSummary.thresholds?.heartRateMax ? `${weekSummary.thresholds.heartRateMax} bpm` : '100 bpm',
      status: weekSummary.avgHeartRate && weekSummary.thresholds?.heartRateMax
        ? weekSummary.avgHeartRate > weekSummary.thresholds.heartRateMax ? 'high' : 'normal'
        : null,
    },
  ].filter((r) => r.avg !== '—');

  if (rows.length === 0) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Metric</th>
            <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Average</th>
            <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Threshold</th>
            <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.metric} className="bg-white">
              <td className="px-4 py-2.5 text-gray-700 font-medium">{r.metric}</td>
              <td className="px-4 py-2.5 text-gray-700">{r.avg}</td>
              <td className="px-4 py-2.5 text-gray-500">{r.threshold}</td>
              <td className="px-4 py-2.5">
                {r.status === 'normal' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Normal
                  </span>
                )}
                {r.status === 'high' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                    High
                  </span>
                )}
                {!r.status && <span className="text-gray-400">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Sub-component: ChecklistItem
   ────────────────────────────────────────────── */
function ChecklistItem({ title, reason }) {
  const [checked, setChecked] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = (e) => {
    e.preventDefault();
    const nextChecked = !checked;
    setChecked(nextChecked);
    setSaved(true);
    const timer = setTimeout(() => {
      setSaved(false);
    }, 2000);
    return () => clearTimeout(timer);
  };

  return (
    <label 
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${
        checked ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200 hover:bg-gray-50'
      }`} 
      onClick={handleToggle}
    >
      <div className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-teal-600 border-teal-600' : 'border-gray-300 bg-white'
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className="flex-1">
        <span className={`block text-xs font-semibold ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {title}
        </span>
        {reason && <span className="block text-[11px] text-gray-500 mt-0.5 leading-relaxed">{reason}</span>}
      </div>
      {saved && (
        <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 animate-fade-in shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Saved!
        </span>
      )}
    </label>
  );
}

/* ──────────────────────────────────────────────
   MAIN EXPORT COMPONENT
   ────────────────────────────────────────────── */
export default function DoctorBriefCard({ brief, patientId, doctorName, onAnnotationSaved }) {
  // Empty State Check
  if (!brief || brief.briefAvailable === false) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-200 rounded-xl shadow-sm max-w-2xl mx-auto text-center mt-6">
        <FileX className="h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-sm font-bold text-gray-700 mb-1">No brief available</h3>
        <p className="text-xs text-gray-500 max-w-sm">
          This patient has not yet generated or shared their AI health report.
        </p>
      </div>
    );
  }

  const {
    aiDoctorBrief,
    aiAdviceGeneratedAt,
    consultationUrgency,
    patient,
    weekSummary,
    earliestLogDate
  } = brief;

  const briefSections = useMemo(
    () => parseBriefSections(aiDoctorBrief),
    [aiDoctorBrief]
  );

  const monitoringSince = earliestLogDate
    ? new Date(earliestLogDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const hasMentalHealthFlag = useMemo(() => {
    return aiDoctorBrief?.toLowerCase().includes('persistent low mood') ||
           aiDoctorBrief?.toLowerCase().includes('phq-9');
  }, [aiDoctorBrief]);

  const [doctorNote, setDoctorNote] = useState(patient?.doctorAnnotation || '');
  const [savingNote, setSavingNote] = useState(false);

  // Sync initial doctor annotation if it changes
  useEffect(() => {
    if (patient?.doctorAnnotation !== undefined) {
      setDoctorNote(patient.doctorAnnotation || '');
    }
  }, [patient?.doctorAnnotation]);

  const handleSaveNote = async () => {
    if (!doctorNote.trim()) {
      toast.error('Note content is required.');
      return;
    }
    if (doctorNote.length > 500) {
      toast.error('Note exceeds 500 characters.');
      return;
    }
    try {
      setSavingNote(true);
      const res = await api.patch(`/doctor/patients/${patientId}/brief/annotate`, { doctorNote });
      if (res.data.success) {
        toast.success('Note sent to patient.');
        if (onAnnotationSaved) {
          onAnnotationSaved(doctorNote);
        }
      }
    } catch (err) {
      toast.error('Failed to save annotation.');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-7 md:p-8 max-w-4xl mx-auto shadow-sm">
      {/* SECTION 1 — PAGE HEADER */}
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="h-[22px] w-[22px] text-teal-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900 uppercase tracking-wider leading-snug">
            CLINICAL BRIEFING NARRATIVE
          </h3>
          <p className="text-xs text-gray-500 italic mt-1">
            AI-generated summary for the treating physician
          </p>
        </div>
      </div>

      <div className="mt-5 border-b border-gray-200"></div>

      {/* SECTION 2 — TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Block A — Patient Overview */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-teal-600 mb-3.5">
              <User className="h-[18px] w-[18px] text-teal-600" /> Patient Overview
            </h4>
            <div className="overflow-hidden rounded-lg border border-teal-100">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-teal-50/40 border-b border-teal-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Age</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Condition</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Monitoring Since</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 text-gray-700 font-medium">
                      {patient?.dob ? `${getAge(patient.dob)} years` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 capitalize">
                      {patient?.conditions?.join(', ') || 'Not specified'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{monitoringSince}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Block B — This Week's Vitals vs Thresholds */}
          {weekSummary && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-teal-600 mb-3.5">
                <TrendingUp className="h-[18px] w-[18px] text-teal-600" /> This Week's Vitals vs Thresholds
              </h4>
              <VitalsTable weekSummary={weekSummary} />
            </div>
          )}

          {/* Block C — Risk Flags */}
          {((briefSections.riskFlags && briefSections.riskFlags.length > 0) || hasMentalHealthFlag) && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-teal-600 mb-3.5">
                <ShieldAlert className="h-[18px] w-[18px] text-teal-600" /> Risk Flags
              </h4>
              <div className="space-y-2.5">
                {briefSections.riskFlags.map((flag, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">{flag.title}</p>
                      {flag.reason && <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">{flag.reason}</p>}
                    </div>
                  </div>
                ))}
                {hasMentalHealthFlag && (
                  <div className="flex items-start gap-2.5 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-purple-800">Mental Health Screening Advisory</p>
                      <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                        Persistent low mood detected. Consider standardised screening (PHQ-9) at next consultation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Block D — Consultation Urgency */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-teal-600 mb-3.5">
              <CalendarDays className="h-[18px] w-[18px] text-teal-600" /> Recommended Consultation Urgency
            </h4>
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border font-bold text-xs uppercase tracking-wider ${
              URGENCY_BADGE[consultationUrgency] || URGENCY_BADGE.none
            }`}>
              <CalendarDays className="h-4 w-4 shrink-0" />
              {URGENCY_LABEL[consultationUrgency] || 'No Immediate Action'}
            </div>
          </div>

          {/* Block E — Nutrition Prescriptions */}
          {briefSections.nutrition && briefSections.nutrition.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-teal-600 mb-3">
                🥗 Nutrition Prescriptions to Discuss
              </h4>
              <ul className="space-y-2">
                {briefSections.nutrition.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                    <span>
                      <strong className="font-semibold text-gray-800">{item.title}</strong>
                      {item.reason && <span className="text-gray-500">{`: ${item.reason}`}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Block F — Lifestyle Prescriptions */}
          {briefSections.lifestyle && briefSections.lifestyle.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-teal-600 mb-3">
                🏃 Lifestyle Prescriptions to Discuss
              </h4>
              <ul className="space-y-2">
                {briefSections.lifestyle.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                    <span>
                      <strong className="font-semibold text-gray-800">{item.title}</strong>
                      {item.reason && <span className="text-gray-500">{`: ${item.reason}`}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3 — CHECKLISTS */}
      {((briefSections.nutrition && briefSections.nutrition.length > 0) || 
        (briefSections.lifestyle && briefSections.lifestyle.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-2">
          {/* Nutrition Checklist */}
          {briefSections.nutrition && briefSections.nutrition.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                🥗 Nutrition Prescriptions Checklist
              </h4>
              <div className="space-y-2.5">
                {briefSections.nutrition.map((item, idx) => (
                  <ChecklistItem key={idx} title={item.title} reason={item.reason} />
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle Checklist */}
          {briefSections.lifestyle && briefSections.lifestyle.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                🏃 Lifestyle Prescriptions Checklist
              </h4>
              <div className="space-y-2.5">
                {briefSections.lifestyle.map((item, idx) => (
                  <ChecklistItem key={idx} title={item.title} reason={item.reason} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4 — FULL NARRATIVE */}
      <div className="mt-6">
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="px-5 py-3.5 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-50 select-none flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-gray-500" /> View Full Clinical Narrative
          </summary>
          <div className="px-5 pb-5 prose prose-sm max-w-none text-gray-700 text-xs leading-relaxed border-t border-gray-100 pt-4">
            <ReactMarkdown>{aiDoctorBrief}</ReactMarkdown>
          </div>
        </details>
      </div>

      {/* SECTION 5 — PHYSICIAN FEEDBACK ANNOTATION */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mt-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-[18px] w-[18px] text-teal-600" />
          <h4 className="text-sm font-bold text-gray-800">Physician Feedback Annotation</h4>
        </div>
        <p className="text-[11px] text-gray-500 mb-4 ml-6">
          Leave a note visible at the top of the patient's AI Advisor page.
        </p>
        <div className="relative">
          <textarea
            value={doctorNote}
            onChange={(e) => setDoctorNote(e.target.value.slice(0, 500))}
            placeholder="Add recommendations, dosage adjustments, or general remarks (max 500 characters)…"
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-xs text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none resize-none bg-gray-50"
          />
          <span className="absolute bottom-3 right-3 text-[10px] text-gray-400 font-semibold">
            {doctorNote.length}/500
          </span>
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSaveNote}
            disabled={savingNote || !doctorNote.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Note for Patient
          </button>
        </div>
      </div>

      {/* SECTION 6 — DISCLAIMER */}
      <div className="flex items-center gap-2.5 text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mt-6">
        <AlertCircle className="h-4 w-4 shrink-0 text-gray-400" />
        <span>
          This brief is AI-generated and based on the latest available patient data.
          Use clinical judgment for diagnosis and treatment decisions.
        </span>
      </div>
    </div>
  );
}
