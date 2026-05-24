import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import {
  Search,
  Clock,
  AlertTriangle,
  AlertCircle,
  Activity,
  Heart,
  FileDown,
  Users,
  FileText,
  MessageSquare,
  Save,
  Loader2,
  CheckSquare,
  Flame,
  User,
  Stethoscope,
  CalendarDays,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Smile,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import DoctorBriefCard from '../components/DoctorBriefCard';
import PatientTrendsView from '../components/PatientTrendsView';

/* ──────────────────────────────────────────────
   Helpers
────────────────────────────────────────────── */
const getAge = (dobString) => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  const diff = Date.now() - birthDate.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const fmtDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const fmtShort = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

const fmtDateTime = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

/* ──────────────────────────────────────────────
   Urgency helpers
────────────────────────────────────────────── */
const URGENCY_DOT = {
  urgent: 'bg-red-500',
  scheduled: 'bg-amber-400',
  none: 'bg-emerald-500',
};
const URGENCY_LABEL = {
  urgent: 'Urgent',
  scheduled: 'Scheduled',
  none: 'No Action',
};
const URGENCY_BADGE = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  none: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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

  const riskSection = match(/##\s*Risk Flags[\s\S]*?(?=##|$)/i);
  const nutritionSection = match(/##\s*Nutrition Prescriptions[\s\S]*?(?=##|$)/i);
  const lifestyleSection = match(/##\s*Lifestyle Prescriptions[\s\S]*?(?=##|$)/i);

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
function VitalsTable({ summary }) {
  if (!summary) return null;

  const rows = [
    {
      metric: 'Glucose',
      avg: summary.avgGlucose ? `${summary.avgGlucose} mg/dL` : '—',
      threshold: summary.thresholds?.glucoseMax ? `${summary.thresholds.glucoseMax} mg/dL` : '180 mg/dL',
      status: summary.avgGlucose && summary.thresholds?.glucoseMax
        ? summary.avgGlucose > summary.thresholds.glucoseMax ? 'high' : 'normal'
        : null,
    },
    {
      metric: 'Blood Pressure',
      avg:
        summary.avgBpSystolic && summary.avgBpDiastolic
          ? `${summary.avgBpSystolic}/${summary.avgBpDiastolic} mmHg`
          : '—',
      threshold: summary.thresholds?.bpSystolicMax
        ? `${summary.thresholds.bpSystolicMax}/90 mmHg`
        : '140/90 mmHg',
      status: summary.avgBpSystolic && summary.thresholds?.bpSystolicMax
        ? summary.avgBpSystolic > summary.thresholds.bpSystolicMax ? 'high' : 'normal'
        : null,
    },
    {
      metric: 'Heart Rate',
      avg: summary.avgHeartRate ? `${summary.avgHeartRate} bpm` : '—',
      threshold: summary.thresholds?.heartRateMax ? `${summary.thresholds.heartRateMax} bpm` : '100 bpm',
      status: summary.avgHeartRate && summary.thresholds?.heartRateMax
        ? summary.avgHeartRate > summary.thresholds.heartRateMax ? 'high' : 'normal'
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
  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${
      checked ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      <div className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-teal-600 border-teal-600' : 'border-gray-300 bg-white'
      }`} onClick={() => setChecked(!checked)}>
        {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>}
      </div>
      <div>
        <span className={`block text-xs font-semibold ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{title}</span>
        {reason && <span className="block text-[11px] text-gray-500 mt-0.5 leading-relaxed">{reason}</span>}
      </div>
    </label>
  );
}

/* ──────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────── */
export default function DoctorPortal() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [activeTab, setActiveTab] = useState('logs');

  const [briefData, setBriefData] = useState(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [doctorNote, setDoctorNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  /* ── Fetch patient list ── */
  const fetchPatients = async () => {
    try {
      setLoadingList(true);
      const res = await api.get('/doctor/patients');
      if (res.data.success) {
        const pts = res.data.patients || [];
        setPatients(pts);
        if (pts.length > 0 && !selectedPatientId) {
          setSelectedPatientId(pts[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching patient list:', err);
      toast.error('Failed to load patient list.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  /* ── Fetch patient detail when selection changes ── */
  useEffect(() => {
    if (!selectedPatientId) return;
    const fetchPatientData = async () => {
      try {
        setLoadingDetails(true);
        setBriefData(null);
        const patientInfo = patients.find((p) => p._id === selectedPatientId);
        setSelectedPatient(patientInfo || null);
        setDoctorNote(patientInfo?.doctorAnnotation || '');

        const [summaryRes, logsRes] = await Promise.all([
          api.get(`/doctor/patients/${selectedPatientId}/summary`),
          api.get(`/doctor/patients/${selectedPatientId}/logs?page=${page}&limit=10`),
        ]);

        if (summaryRes.data.success) setSummary(summaryRes.data.summary);
        if (logsRes.data.success) {
          setLogs(logsRes.data.logs || []);
          setTotalPages(logsRes.data.totalPages || 1);
        }
      } catch (err) {
        console.error('Error fetching patient details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchPatientData();
  }, [selectedPatientId, page, patients]);

  /* ── Fetch AI brief when tab switches ── */
  const fetchDoctorBrief = async () => {
    if (!selectedPatientId) return;
    try {
      setLoadingBrief(true);
      setBriefData(null);
      const res = await api.get(`/doctor/patients/${selectedPatientId}/brief`);
      if (res.data.success) setBriefData(res.data);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || '';
      if (status === 403) {
        setBriefData({ briefAvailable: false, reason: message || 'Patient has not shared their AI report yet.' });
      } else {
        console.error('Error fetching doctor brief:', err);
        toast.error('Failed to fetch AI Doctor Brief.');
      }
    } finally {
      setLoadingBrief(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'brief' && selectedPatientId) fetchDoctorBrief();
  }, [activeTab, selectedPatientId]);

  /* ── PDF download ── */
  const downloadReport = async (reportType = 'patient') => {
    if (!selectedPatientId || !selectedPatient) return;
    const toastId = toast.loading(`Generating ${reportType === 'doctor' ? 'Doctor Brief' : 'Patient Report'} PDF…`);
    try {
      const response = await api.get(
        `/reports/weekly?patientId=${selectedPatientId}&type=${reportType}`,
        { responseType: 'blob' }
      );
      const contentType = response.headers?.['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        toast.error(json.message || 'Access denied.', { id: toastId });
        return;
      }
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download',
        reportType === 'doctor'
          ? `doctor_brief_${selectedPatient.name.replace(/\s+/g, '_')}.pdf`
          : `weekly_report_${selectedPatient.name.replace(/\s+/g, '_')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded successfully!', { id: toastId });
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          toast.error(json.message || 'Failed to download PDF.', { id: toastId });
          return;
        } catch {}
      }
      toast.error(err.response?.data?.message || 'Failed to download PDF.', { id: toastId });
    }
  };

  /* ── Save doctor annotation ── */
  const handleSaveNote = async () => {
    if (!doctorNote.trim()) { toast.error('Note content is required.'); return; }
    if (doctorNote.length > 500) { toast.error('Note exceeds 500 characters.'); return; }
    try {
      setSavingNote(true);
      const res = await api.patch(`/doctor/patients/${selectedPatientId}/brief/annotate`, { doctorNote });
      if (res.data.success) {
        toast.success('Note sent to patient.');
        setPatients((prev) =>
          prev.map((p) => p._id === selectedPatientId
            ? { ...p, doctorAnnotation: doctorNote, doctorAnnotationBy: 'You' }
            : p
          )
        );
      }
    } catch (err) {
      toast.error('Failed to save annotation.');
    } finally {
      setSavingNote(false);
    }
  };

  /* ── Derived data ── */
  const filteredPatients = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [patients, searchQuery]
  );

  const briefSections = useMemo(
    () => parseBriefSections(briefData?.aiDoctorBrief),
    [briefData]
  );

  const monitoringSince = selectedPatient?.createdAt
    ? new Date(selectedPatient.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  const hasMentalHealthFlag =
    briefData?.aiDoctorBrief?.toLowerCase().includes('persistent low mood') ||
    briefData?.aiDoctorBrief?.toLowerCase().includes('phq-9');

  const urgency = selectedPatient?.consultationUrgency || 'none';
  const briefUrgency = briefData?.consultationUrgency || urgency;

  /* ──────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────── */
  return (
    <div className="-mx-6 -my-6 flex bg-gray-50" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ═══════════════════════════════
          LEFT SIDEBAR — Patient List
      ═══════════════════════════════ */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">

        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-teal-600" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Shared Patients</h3>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50"
            />
          </div>
        </div>

        {/* Patient list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loadingList ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">No patients found</p>
            </div>
          ) : (
            filteredPatients.map((p) => {
              const active = p._id === selectedPatientId;
              const dot = URGENCY_DOT[p.consultationUrgency] || URGENCY_DOT.none;
              return (
                <button
                  key={p._id}
                  onClick={() => {
                    setSelectedPatientId(p._id);
                    setPage(1);
                    setActiveTab('logs');
                  }}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    active ? 'bg-teal-50 border-l-4 border-l-teal-600' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                    <span className={`text-sm font-semibold ${active ? 'text-teal-700' : 'text-gray-800'}`}>
                      {p.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate ml-4">{p.email}</p>
                  {p.lastLogDate ? (
                    <div className="flex items-center gap-1 ml-4 mt-1.5">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">
                        Last Log: {fmtShort(p.lastLogDate)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 ml-4 mt-1">No logs yet</p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {!selectedPatient && !loadingDetails ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Stethoscope className="h-14 w-14 text-gray-300 mb-4" />
            <h2 className="text-lg font-bold text-gray-700 mb-1">Select a Patient</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Choose a patient from the sidebar to view their health records and AI clinical brief.
            </p>
          </div>
        ) : loadingDetails && !selectedPatient ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          </div>
        ) : selectedPatient ? (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* ── Page Header ── */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Welcome back, <span className="text-teal-600">Dr.</span>
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Age: {getAge(selectedPatient.dob) || '—'}
                    {selectedPatient.dob && ` (${new Date(selectedPatient.dob).toLocaleDateString()})`}
                  </span>
                  {selectedPatient.conditions?.length > 0 && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5" />
                        Condition: {selectedPatient.conditions.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Download buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadReport('patient')}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Download Patient Report
                </button>
                {selectedPatient.sharedAiAdvice && (
                  <button
                    onClick={() => downloadReport('doctor')}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition-colors shadow-sm"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Download Doctor Brief
                  </button>
                )}
              </div>
            </div>

            {/* ── Patient Name Bar ── */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{selectedPatient.name}</h2>
            </div>

            {/* ── Tabs ── */}
            <div className="bg-white border-b border-gray-200 px-6 flex shrink-0">
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'logs'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Vitals &amp; Logs
              </button>
              <button
                onClick={() => setActiveTab('brief')}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'brief'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                AI Doctor Brief
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'trends'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Trends &amp; Graphs
              </button>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ============================================================
                  TAB 1: VITALS & LOGS
              ============================================================ */}
              {activeTab === 'logs' && (
                <div className="space-y-6">

                  {/* Summary stats */}
                  {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        {
                          label: 'Avg Glucose',
                          value: summary.avgGlucose ? `${summary.avgGlucose} mg/dL` : '—',
                          sub: `Threshold: ${summary.thresholds?.glucoseMax || 180} mg/dL`,
                          icon: Activity,
                          color: summary.avgGlucose > (summary.thresholds?.glucoseMax || 180) ? 'red' : 'teal',
                        },
                        {
                          label: 'Avg Blood Pressure',
                          value: summary.avgBpSystolic
                            ? `${summary.avgBpSystolic}/${summary.avgBpDiastolic} mmHg`
                            : '—',
                          sub: `Systolic Limit: ${summary.thresholds?.bpSystolicMax || 140}`,
                          icon: Heart,
                          color: summary.avgBpSystolic > (summary.thresholds?.bpSystolicMax || 140) ? 'red' : 'indigo',
                        },
                        {
                          label: 'Logging Streak',
                          value: `${summary.streak || 0} Days`,
                          sub: 'Consecutive active days',
                          icon: Flame,
                          color: 'green',
                        },
                      ].map((card) => (
                        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                              card.color === 'red' ? 'bg-red-50 text-red-600'
                              : card.color === 'teal' ? 'bg-teal-50 text-teal-600'
                              : card.color === 'indigo' ? 'bg-indigo-50 text-indigo-600'
                              : 'bg-green-50 text-green-600'
                            }`}>
                              <card.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{card.label}</p>
                              <p className="text-lg font-bold text-gray-900 mt-0.5">{card.value}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Log timeline */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Health Log Timeline
                      </h3>
                    </div>

                    {logs.length === 0 ? (
                      <div className="p-10 text-center">
                        <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 font-medium">No logs recorded yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {logs.map((log) => (
                          <div key={log._id} className="p-5 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-800">{fmtDateTime(log.loggedAt)}</span>
                              <span className="text-[10px] px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full font-bold uppercase border">
                                {log.source}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                              {[
                                { label: 'Glucose', val: log.vitals?.glucose, unit: 'mg/dL' },
                                {
                                  label: 'Blood Pressure',
                                  val: log.vitals?.bpSystolic && log.vitals?.bpDiastolic
                                    ? `${log.vitals.bpSystolic}/${log.vitals.bpDiastolic}`
                                    : null,
                                  unit: 'mmHg',
                                },
                                { label: 'Heart Rate', val: log.vitals?.heartRate, unit: 'bpm' },
                                { label: 'O2 Sat', val: log.vitals?.oxygenSat, unit: '%' },
                                { label: 'Temp', val: log.vitals?.temperature, unit: '°C' },
                                { label: 'Weight', val: log.vitals?.weight, unit: 'kg' },
                              ]
                                .filter((v) => v.val)
                                .map((v) => (
                                  <div key={v.label}>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{v.label}</p>
                                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                                      {v.val} {v.unit}
                                    </p>
                                  </div>
                                ))}
                            </div>
                            {log.symptoms?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {log.symptoms.map((s) => (
                                  <span key={s} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full font-semibold capitalize">
                                    {s.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-3 flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Smile className="h-3.5 w-3.5" />
                                Mood: <strong>{log.moodScore || '—'}/10</strong>
                              </span>
                              {log.notes && (
                                <span className="text-gray-400 italic truncate max-w-xs">{log.notes}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Previous
                      </button>
                      <span className="text-xs font-medium text-gray-500">Page {page} of {totalPages}</span>
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================
                  TAB 2: AI DOCTOR BRIEF
              ============================================================ */}
              {activeTab === 'brief' && (
                <div className="space-y-5">
                  {/* Loading */}
                  {loadingBrief && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                      <p className="text-sm text-gray-500 font-medium">Retrieving AI Doctor Brief…</p>
                    </div>
                  )}

                  {/* Brief available card */}
                  {!loadingBrief && briefData && (
                    <DoctorBriefCard
                      brief={briefData}
                      patientId={selectedPatientId}
                      doctorName="Doctor"
                      onAnnotationSaved={(newNote) => {
                        setPatients((prev) =>
                          prev.map((p) => p._id === selectedPatientId
                            ? { ...p, doctorAnnotation: newNote, doctorAnnotationBy: 'You' }
                            : p
                          )
                        );
                        setSelectedPatient((prev) => prev ? { ...prev, doctorAnnotation: newNote } : null);
                        setDoctorNote(newNote);
                      }}
                    />
                  )}
                </div>
              )}

              {/* ============================================================
                  TAB 3: PATIENT TRENDS & GRAPHS
              ============================================================ */}
              {activeTab === 'trends' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-4xl mx-auto">
                  <PatientTrendsView
                    patientId={selectedPatientId}
                    thresholds={selectedPatient?.thresholds}
                  />
                </div>
              )}

            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
