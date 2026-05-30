import React, { useState, useEffect, useRef, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Activity, 
  Heart, 
  Pill, 
  Smile, 
  Flame, 
  Download, 
  Share2, 
  RefreshCw, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIAdvisor() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Snapshot states
  const [snapshot, setSnapshot] = useState(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);

  // Advice states
  const [reportText, setReportText] = useState('');
  const [isCached, setIsCached] = useState(false);
  const [cachedTime, setCachedTime] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [errorState, setErrorState] = useState(null); // null | 'insufficient_data' | 'api_failure' | 'interrupted'

  // UI state
  const [activeTab, setActiveTab] = useState('physical'); // physical | mental | nutrition | lifestyle | medication
  const [showAnnotation, setShowAnnotation] = useState(true);
  
  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [sharingWith, setSharingWith] = useState(null); // id of doctor currently being shared with

  // Abort controller for canceling stream
  const abortController = useRef(null);

  // Fetch Left Panel Snapshot
  const fetchSnapshot = async () => {
    try {
      setLoadingSnapshot(true);
      const res = await api.get('/trends/summary');
      if (res.data.success) {
        setSnapshot(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching trends summary:', err);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  // Fetch current advice (initial load, uses cache)
  const loadCurrentAdvice = async () => {
    try {
      setErrorState(null);
      const res = await api.get('/advisor/weekly-advice');
      if (res.data.success) {
        if (res.data.cached) {
          setReportText(res.data.aiAdvice);
          setCachedTime(new Date(res.data.aiAdviceGeneratedAt));
          setIsCached(true);
        }
      }
    } catch (err) {
      console.error('Error fetching advice on load:', err);
      if (err.response && err.response.status === 400 && err.response.data.error === 'insufficient_data') {
        setErrorState('insufficient_data');
      } else {
        setErrorState('api_failure');
      }
    }
  };

  useEffect(() => {
    fetchSnapshot();
    loadCurrentAdvice();
  }, []);

  // Fetch doctors for share modal
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const res = await api.get('/auth/doctors');
      if (res.data.success) {
        // Filter doctors connected to patient: user.sharedWithDoctors contains IDs
        const connected = (res.data.doctors || []).filter(doc => 
          user?.sharedWithDoctors?.includes(doc._id)
        );
        setDoctorsList(connected);
      }
    } catch (err) {
      console.error('Error fetching doctors list:', err);
      toast.error('Failed to load doctors list.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    if (showShareModal) {
      fetchDoctors();
    }
  }, [showShareModal]);

  // Stream advice from API (Triggered by Generate/Regenerate)
  const triggerGenerateAdvice = async (force = false) => {
    setStreaming(true);
    setErrorState(null);
    setReportText('');
    setIsCached(false);

    abortController.current = new AbortController();

    try {
      const baseUrl = api.defaults.baseURL || '/api';
      const response = await fetch(`${baseUrl}/advisor/weekly-advice${force ? '?force=true' : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.current.signal
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errData = await response.json().catch(() => ({}));
          if (errData.error === 'insufficient_data') {
            setErrorState('insufficient_data');
            setStreaming(false);
            return;
          }
        }
        throw new Error('Advisor API request failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (part.trim() === '') continue;

          if (part.startsWith('data: ')) {
            const dataStr = part.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') {
              setStreaming(false);
              setIsCached(true);
              setCachedTime(new Date());
              fetchSnapshot(); // refresh stats
              break;
            } else if (dataStr === '[ERROR]') {
              setErrorState('api_failure');
              setStreaming(false);
              return;
            } else {
              setReportText(prev => prev + dataStr);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorState('interrupted');
      } else {
        console.error('Streaming error:', err);
        setErrorState('api_failure');
      }
      setStreaming(false);
    }
  };

  // Cancel active stream
  const cancelGeneration = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
  };

  // Share report with doctor
  const shareWithDoctor = async (doctorId) => {
    try {
      setSharingWith(doctorId);
      const res = await api.post('/advisor/share', { doctorId });
      if (res.data.success) {
        toast.success('AI advice shared with your doctor successfully.');
        setShowShareModal(false);
      }
    } catch (err) {
      console.error('Error sharing advice:', err);
    } finally {
      setSharingWith(null);
    }
  };

  // PDF Download Trigger
  const downloadPDFReport = async () => {
    const toastId = toast.loading('Generating PDF report...');
    try {
      const response = await api.get('/reports/weekly?type=patient', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `weekly_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download PDF report.', { id: toastId });
    }
  };

  // Text Parsers for Custom Layouts
  const parsedSections = React.useMemo(() => {
    const sections = {
      overview: '',
      physical: '',
      mental: '',
      nutrition: '',
      lifestyle: '',
      medication: '',
      keepGoing: ''
    };

    if (!reportText) return sections;

    const parts = reportText.split(/(?=## )/);
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.startsWith('## Weekly Overview') || trimmed.startsWith('## Key Observations') || trimmed.startsWith('## AI Clinical Insight')) {
        sections.overview = trimmed.replace(/^##\s*(Weekly Overview|Key Observations|AI Clinical Insight)/i, '').trim();
      } else if (trimmed.startsWith('## Physical Health') || trimmed.startsWith('## Health Pattern Interpretation') || trimmed.startsWith('## Physical Wellness Strategy') || trimmed.startsWith('## Physical Optimization Strategy')) {
        sections.physical = (sections.physical ? sections.physical + '\n\n' : '') + trimmed;
      } else if (trimmed.startsWith('## Mental Wellness') || trimmed.startsWith('## Mental & Emotional Guidance') || trimmed.startsWith('## Mental & Emotional Wellness')) {
        sections.mental = trimmed;
      } else if (trimmed.startsWith('## Nutrition Guide') || trimmed.startsWith('## Nutrition Optimization')) {
        sections.nutrition = trimmed;
      } else if (trimmed.startsWith('## Lifestyle & Habits') || trimmed.startsWith('## Lifestyle Adjustments') || trimmed.startsWith('## Lifestyle') || trimmed.startsWith('## Lifestyle & Recovery Guidance')) {
        sections.lifestyle = trimmed;
      } else if (trimmed.startsWith('## Medication Reminder') || trimmed.startsWith('## Medication') || trimmed.startsWith('## Preventive Focus')) {
        sections.medication = trimmed;
      } else if (trimmed.startsWith('## Keep Going') || trimmed.startsWith('## Encouraging Summary') || trimmed.startsWith('## Encouraging Closing Insight')) {
        sections.keepGoing = trimmed.replace(/^##\s*(Keep Going|Encouraging Summary|Encouraging Closing Insight)/i, '').trim();
      }
    });

    return sections;
  }, [reportText]);

  // Specific Nutrition Card Parser
  const nutritionLayout = React.useMemo(() => {
    const text = parsedSections.nutrition;
    const eatMore = [];
    const avoid = [];
    let mealTiming = '';

    if (!text) return { eatMore, avoid, mealTiming };

    const eatMoreMatch = text.match(/Foods to eat more of[^]*?(?=Foods to reduce|Meal timing|$)/i);
    const avoidMatch = text.match(/Foods to reduce[^]*?(?=Meal timing|$)/i);
    const timingMatch = text.match(/Meal timing[^]*?$/i);

    const parseList = (sectionText) => {
      if (!sectionText) return [];
      const items = [];
      const lines = sectionText.split('\n');
      lines.forEach(line => {
        const clean = line.replace(/^[-*•]\s*/, '').trim();
        if (clean && (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•'))) {
          const parts = clean.split(/[—–:-]/);
          const food = parts[0]?.trim();
          const reason = parts.slice(1).join('—').trim();
          items.push({ food, reason });
        }
      });
      return items;
    };

    if (eatMoreMatch) eatMore.push(...parseList(eatMoreMatch[0]));
    if (avoidMatch) avoid.push(...parseList(avoidMatch[0]));
    if (timingMatch) {
      mealTiming = timingMatch[0].replace(/Meal timing tip\s*[-—:]*\s*/i, '').trim();
    }

    return { eatMore, avoid, mealTiming };
  }, [parsedSections.nutrition]);

  // Specific Lifestyle Habits Parser
  const lifestyleLayout = React.useMemo(() => {
    const text = parsedSections.lifestyle;
    const build = [];
    const reduce = [];
    let focus = '';

    if (!text) return { build, reduce, focus };

    const buildMatch = text.match(/Build these habits[^]*?(?=Habits to reduce|This week's one focus|$)/i);
    const reduceMatch = text.match(/Habits to reduce[^]*?(?=This week's one focus|$)/i);
    const focusMatch = text.match(/This week's one focus[^]*?$/i);

    const parseList = (sectionText) => {
      if (!sectionText) return [];
      const items = [];
      const lines = sectionText.split('\n');
      lines.forEach(line => {
        const clean = line.replace(/^[-*•]\s*/, '').trim();
        if (clean && (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•'))) {
          items.push(clean);
        }
      });
      return items;
    };

    if (buildMatch) build.push(...parseList(buildMatch[0]));
    if (reduceMatch) reduce.push(...parseList(reduceMatch[0]));
    if (focusMatch) {
      focus = focusMatch[0]
        .replace(/This week's one focus\s*[-—:]*\s*/i, '')
        .replace(/\*\*+/g, '')
        .trim();
    }

    return { build, reduce, focus };
  }, [parsedSections.lifestyle]);

  // Client-side Risk badges derived from report texts
  const riskBadges = React.useMemo(() => {
    let physical = 'low';
    let mental = 'stable';
    let nutrition = 'none';

    if (!reportText) return { physical, mental, nutrition };

    const lowerText = reportText.toLowerCase();

    // Physical Risk
    if (lowerText.includes('high physical risk') || lowerText.includes('severe cardiovascular risk') || (lowerText.includes('elevated') && lowerText.includes('risk') && lowerText.includes('glucose') && lowerText.includes('cardiovascular'))) {
      physical = 'high';
    } else if (lowerText.includes('elevated') || lowerText.includes('above threshold') || lowerText.includes('exceeded')) {
      physical = 'moderate';
    }

    // Mental Wellness
    if (lowerText.includes('mental health professional') || lowerText.includes('persistent low mood') || lowerText.includes('counsellor')) {
      mental = 'concern';
    } else if (lowerText.includes('mood trend: declining') || lowerText.includes('declining mood') || lowerText.includes('lowest mood')) {
      mental = 'watch';
    }

    // Nutrition Alert
    if (lowerText.includes('nutrition alert') || lowerText.includes('rapid blood glucose spike') || lowerText.includes('avoid')) {
      nutrition = 'review';
    } else if (lowerText.includes('reduce')) {
      nutrition = 'some';
    }

    return { physical, mental, nutrition };
  }, [reportText]);

  // Emoji helper for mood
  const getMoodEmoji = (val) => {
    if (val <= 3) return '😔';
    if (val <= 5) return '😐';
    if (val <= 7) return '🙂';
    return '😊';
  };

  return (
    <div className="space-y-8 max-w-6xl w-full mx-auto py-4">
      
      {/* Page Title Header */}
      <div className="pb-2">
        <h1 className="text-[28px] font-bold text-gray-900 flex items-center gap-2.5 tracking-tight leading-none">
          <Brain className="h-8 w-8 text-teal-600 animate-pulse" /> 360° AI Health Advisor
        </h1>
        <p className="text-[14px] text-gray-500 mt-2 font-medium">Tailored physical, mental, and nutritional advice powered by Claude</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ========================================================
            LEFT COLUMN PANEL: WEEKLY SNAPSHOT
            ======================================================== */}
        <div className="w-full lg:w-72 shrink-0 space-y-4 bg-surface-l1 rounded-xl p-6 transition-premium hover:-translate-y-[1px]">
          <h2 className="font-bold text-xs text-gray-500 uppercase tracking-wider border-b pb-2 flex items-center justify-between">
            This Week's Snapshot
            {loadingSnapshot && <Loader2 className="h-3 w-3 text-teal-600 animate-spin" />}
          </h2>

          {loadingSnapshot ? (
            // Shimmer skeletons for snapshot stats
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer rounded-lg"></div>
              ))}
            </div>
          ) : snapshot ? (
            <div className="space-y-4 divide-y divide-gray-100">
              
              {/* Avg Glucose Card */}
              <div className="card border-l-4 border-teal-500 pl-3 pt-3 mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Glucose</span>
                <div className="flex items-end justify-between mt-1">
                  <span className="text-base font-bold text-gray-900">
                    {snapshot.avgGlucose ? `${snapshot.avgGlucose} mg/dL` : 'No data'}
                  </span>
                  
                  {/* Glucose Sparkline (Sized by value) */}
                  {snapshot.dailyGlucose && snapshot.dailyGlucose.length > 0 && (
                    <div className="flex items-center gap-1 h-5 mb-0.5">
                      {snapshot.dailyGlucose.map((val, idx) => {
                        const minG = 80, maxG = 250;
                        const size = Math.max(4, Math.min(10, ((val - minG) / (maxG - minG)) * 6 + 4));
                        return (
                          <div 
                            key={idx}
                            className={`rounded-full shrink-0 ${val > 180 ? 'bg-red-500' : 'bg-teal-500'}`}
                            style={{ width: `${size}px`, height: `${size}px` }}
                            title={`Glucose: ${val} mg/dL`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Blood Pressure Card */}
              <div className="card border-l-4 border-indigo-500 pl-3 pt-3 mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Blood Pressure</span>
                <span className="text-base font-bold text-gray-900 mt-1 block">
                  {snapshot.avgBpSystolic && snapshot.avgBpDiastolic 
                    ? `${snapshot.avgBpSystolic}/${snapshot.avgBpDiastolic} mmHg`
                    : 'No data'
                  }
                </span>
              </div>

              {/* Heart Rate Card */}
              <div className="pt-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Heart Rate</span>
                <span className="text-base font-bold text-gray-900 mt-1 block">
                  {snapshot.avgHeartRate ? `${snapshot.avgHeartRate} bpm` : 'No data'}
                </span>
              </div>

              {/* Mood Card */}
              <div className="pt-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Mood Score</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-bold text-gray-900">
                    {snapshot.avgMood ? `${snapshot.avgMood}/10` : 'No data'}
                  </span>
                  {snapshot.avgMood && (
                    <span className="text-sm">{getMoodEmoji(snapshot.avgMood)}</span>
                  )}
                  {snapshot.moodTrend && snapshot.moodTrend !== '→' && (
                    <span className={`text-xs font-bold ${snapshot.moodTrend === '↑' ? 'text-green-600' : 'text-red-600'}`}>
                      {snapshot.moodTrend}
                    </span>
                  )}
                </div>
              </div>

              {/* Streak Card */}
              <div className="pt-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Logging Streak</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500 shrink-0" />
                  <span className="text-base font-bold text-gray-900">{snapshot.streak > 0 ? `${snapshot.streak} Days Logged` : 'Start Logging!'}</span>
                </div>
              </div>

              {/* Top Symptoms Tags */}
              <div className="pt-3">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Symptoms This Week</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {snapshot.topSymptoms && snapshot.topSymptoms.length > 0 ? (
                    snapshot.topSymptoms.map(sym => (
                      <span key={sym} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 border border-teal-100 text-teal-700 capitalize">
                        {sym}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">None logged</span>
                  )}
                </div>
              </div>

              {/* Prescriptions Count */}
              <div className="pt-3">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Active Medications</span>
                <span className="text-base font-bold text-gray-900 mt-1 block">
                  {snapshot.activeMedicationsCount || 0} Prescriptions
                </span>
              </div>

            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">Failed to load weekly trends.</div>
          )}
        </div>

        {/* ========================================================
            RIGHT COLUMN PANEL: REPORT GENERATOR & VIEWER
            ======================================================== */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm">

          {/* ── HEADER ROW (white bg) ── */}
          <div className="flex items-center justify-between gap-3 bg-white border-b border-[#e5e7eb] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#E1F5EE] flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-[#0F6E56]" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-[#1a1a1a] leading-tight">Weekly health analysis</h3>
                {isCached && cachedTime && (
                  <span className="text-[11px] text-[#6b7280] block mt-0.5">
                    Generated {Math.max(0, Math.round((new Date() - cachedTime) / (60 * 60 * 1000)))}h ago · 24h cache active
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {isCached && reportText && (
                <button
                  onClick={() => triggerGenerateAdvice(true)}
                  disabled={streaming}
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#0F6E56] rounded-lg text-[13px] font-semibold text-[#0F6E56] bg-white hover:bg-[#F0FAF7] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${streaming ? 'animate-spin' : ''}`} /> Regenerate
                </button>
              )}
              {!reportText && !streaming && errorState !== 'insufficient_data' && (
                <button
                  onClick={() => triggerGenerateAdvice(false)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
                >
                  Generate AI advice
                </button>
              )}
            </div>
          </div>

          {/* ── BODY (white bg) ── */}
          <div className="flex-1 bg-white px-5 py-5 space-y-5">

            {/* Doctor annotation banner */}
            {showAnnotation && (user?.doctorAnnotation || user?.prevDoctorAnnotation) && (
              <div className={`p-4 border-l-4 rounded-r-xl flex items-start justify-between ${
                user.doctorAnnotation ? 'border-teal-500 bg-teal-50/30' : 'border-gray-300 bg-gray-50/50'
              }`}>
                <div className="space-y-1">
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider ${
                    user.doctorAnnotation ? 'text-teal-800' : 'text-gray-500'
                  }`}>
                    {user.doctorAnnotation
                      ? `Message from Dr. ${user.doctorAnnotationBy || 'Doctor'}`
                      : 'Note from a previous report'}
                  </h4>
                  <p className="text-xs text-gray-800 leading-normal italic">
                    "{user.doctorAnnotation || user.prevDoctorAnnotation}"
                  </p>
                </div>
                <button
                  onClick={() => setShowAnnotation(false)}
                  className="text-gray-400 hover:text-gray-600 shrink-0 ml-4 hover:bg-gray-100 p-0.5 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── STREAMING STATE ── */}
            {streaming && (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex gap-1.5 h-3 items-center">
                  <div className="h-2.5 w-2.5 bg-teal-600 rounded-full animate-bounce delay-75"></div>
                  <div className="h-2.5 w-2.5 bg-teal-600 rounded-full animate-bounce delay-150"></div>
                  <div className="h-2.5 w-2.5 bg-teal-600 rounded-full animate-bounce delay-200"></div>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-700">Analysing your last 7 days...</p>
                  <p className="text-xs text-gray-400 mt-1">Reviewing vitals thresholds, daily logs, and nutrition preferences</p>
                </div>
                <button
                  onClick={cancelGeneration}
                  className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel Generation
                </button>
              </div>
            )}

            {/* ── ERROR STATES ── */}
            {!streaming && errorState === 'insufficient_data' && (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
                <AlertCircle className="h-10 w-10 text-amber-500 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-gray-700">Insufficient Vitals History</p>
                  <p className="text-xs text-gray-400 mt-1.5 leading-normal">
                    You need to record vitals for at least 3 days in the past week to unlock Claude's AI clinical summaries.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/log')}
                  className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  Log Vitals Now <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {!streaming && errorState === 'api_failure' && (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
                <AlertTriangle className="h-10 w-10 text-red-500 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-gray-700">Service Temporarily Unavailable</p>
                  <p className="text-xs text-gray-400 mt-1.5 leading-normal">
                    Your AI advisor is temporarily unavailable. Please try again in a few minutes.
                  </p>
                </div>
                <button
                  onClick={() => triggerGenerateAdvice(false)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 mx-auto"
                >
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
              </div>
            )}

            {/* Interrupted warning */}
            {!streaming && errorState === 'interrupted' && reportText && (
              <div className="p-4 border-l-4 border-amber-500 bg-amber-50/30 rounded-r-xl flex items-start justify-between">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Incomplete Generation</p>
                    <p className="text-xs text-gray-700 mt-0.5 leading-normal">
                      This report may be incomplete — tap Regenerate for a fresh analysis.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setErrorState(null)}
                  className="text-amber-500 hover:text-amber-700 shrink-0 font-bold text-[10px] uppercase border border-amber-200 px-2 py-0.5 rounded hover:bg-amber-100/30"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ── COMPLETED REPORT ── */}
            {reportText && (
              <div className="space-y-5">

                {/* QUOTE BOX: teal left border, light teal bg, italic text */}
                {parsedSections.overview && (
                  <div className="border-l-4 border-teal-500 bg-teal-50 rounded-r-xl px-4 py-3">
                    <p className="text-[13px] text-teal-900 leading-relaxed italic">
                      "{parsedSections.overview}"
                    </p>
                  </div>
                )}

                {/* TABS: underline style, icon + text, scrollable */}
                <div className="flex overflow-x-auto scrollbar-none border-b border-gray-200 gap-0">
                  {[
                    { id: 'physical', label: 'Physical', icon: Activity },
                    { id: 'mental', label: 'Mental', icon: Smile },
                    { id: 'nutrition', label: 'Nutrition', icon: Brain },
                    { id: 'lifestyle', label: 'Lifestyle', icon: TrendingUp },
                    { id: 'medication', label: 'Preventive', icon: Pill }
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 text-[13px] font-medium whitespace-nowrap transition-colors -mb-px ${
                          activeTab === tab.id
                            ? 'border-teal-600 text-teal-600'
                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* TAB CONTENT AREA */}
                <div className="min-h-[220px]">

                  {/* Generic tab renderer — numbered pill cards */}
                  {['physical', 'mental', 'nutrition', 'lifestyle', 'medication'].map(tabId => {
                    const sectionText = parsedSections[tabId];
                    if (activeTab !== tabId || !sectionText) return null;

                    // Parse into icon+title row and bullet list items
                    const lines = sectionText.split('\n');
                    const titleLine = (lines[0] || '').replace(/^##\s*/, '').trim();
                    const introLines = [];
                    const bulletItems = [];
                    let seenBullet = false;
                    lines.slice(1).forEach(line => {
                      const cleaned = line.replace(/^[-*•]\s*/, '').trim();
                      if (!cleaned) return;
                      if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•')) {
                        seenBullet = true;
                        bulletItems.push(cleaned);
                      } else if (!seenBullet) {
                        introLines.push(cleaned);
                      }
                    });
                    const intro = introLines.join(' ');

                    const tabMeta = {
                      physical: { icon: Activity, color: 'text-blue-600' },
                      mental: { icon: Smile, color: 'text-purple-600' },
                      nutrition: { icon: Brain, color: 'text-teal-600' },
                      lifestyle: { icon: TrendingUp, color: 'text-green-600' },
                      medication: { icon: Pill, color: 'text-orange-600' },
                    };
                    const meta = tabMeta[tabId];
                    const TabIcon = meta.icon;

                    return (
                      <div key={tabId} className="space-y-4">
                        {/* Section title with icon box */}
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <TabIcon className={`h-4 w-4 ${meta.color}`} />
                          </div>
                          <h4 className="text-[15px] font-bold text-gray-900">{titleLine}</h4>
                        </div>

                        {/* Intro paragraph */}
                        {intro && (
                          <p className="text-[14px] text-gray-600 leading-[1.8]">{intro}</p>
                        )}

                        {/* Numbered pill cards */}
                        {bulletItems.length > 0 ? (
                          <div className="space-y-2">
                            {bulletItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 px-4 py-[14px] bg-[#F0FAF7] border border-[#9FE1CB] rounded-[10px]"
                              >
                                <span className="h-6 w-6 rounded-full bg-[#0F6E56] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="text-[13px] text-[#1a1a1a] leading-relaxed">{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Fallback: if no bullets, render raw markdown
                          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                            <ReactMarkdown>{sectionText}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* MOTIVATION / KEEP GOING BOX — amber bg */}
                {parsedSections.keepGoing && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-amber-500 text-base shrink-0">✦</span>
                    <p className="text-[13px] text-amber-800 leading-relaxed">
                      {parsedSections.keepGoing}
                    </p>
                  </div>
                )}

                {/* CLINICAL FLAGS — 3 equal colour-coded cards */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Physical Risk */}
                    <div className={`rounded-xl p-4 ${
                      riskBadges.physical === 'high'
                        ? 'bg-red-50'
                        : riskBadges.physical === 'moderate'
                          ? 'bg-orange-50'
                          : 'bg-green-50'
                    }`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        riskBadges.physical === 'high'
                          ? 'text-red-600'
                          : riskBadges.physical === 'moderate'
                            ? 'text-orange-600'
                            : 'text-green-600'
                      }`}>Physical Risk</p>
                      <p className={`text-[15px] font-semibold ${
                        riskBadges.physical === 'high'
                          ? 'text-red-700'
                          : riskBadges.physical === 'moderate'
                            ? 'text-orange-700'
                            : 'text-green-700'
                      }`}>
                        {riskBadges.physical === 'high' ? 'High' : riskBadges.physical === 'moderate' ? 'Moderate' : 'Low'}
                      </p>
                    </div>

                    {/* Mental Wellness */}
                    <div className={`rounded-xl p-4 ${
                      riskBadges.mental === 'concern'
                        ? 'bg-red-50'
                        : riskBadges.mental === 'watch'
                          ? 'bg-amber-50'
                          : 'bg-green-50'
                    }`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        riskBadges.mental === 'concern'
                          ? 'text-red-600'
                          : riskBadges.mental === 'watch'
                            ? 'text-amber-600'
                            : 'text-green-600'
                      }`}>Mental Wellness</p>
                      <p className={`text-[15px] font-semibold ${
                        riskBadges.mental === 'concern'
                          ? 'text-red-700'
                          : riskBadges.mental === 'watch'
                            ? 'text-amber-700'
                            : 'text-green-700'
                      }`}>
                        {riskBadges.mental === 'concern' ? 'Concern' : riskBadges.mental === 'watch' ? 'Watch' : 'Stable'}
                      </p>
                    </div>

                    {/* Nutrition Alert */}
                    <div className={`rounded-xl p-4 ${
                      riskBadges.nutrition === 'review'
                        ? 'bg-red-50'
                        : riskBadges.nutrition === 'some'
                          ? 'bg-yellow-50'
                          : 'bg-green-50'
                    }`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        riskBadges.nutrition === 'review'
                          ? 'text-red-600'
                          : riskBadges.nutrition === 'some'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}>Nutrition Alert</p>
                      <p className={`text-[15px] font-semibold ${
                        riskBadges.nutrition === 'review'
                          ? 'text-red-700'
                          : riskBadges.nutrition === 'some'
                            ? 'text-yellow-700'
                            : 'text-green-700'
                      }`}>
                        {riskBadges.nutrition === 'review' ? 'Review Needed' : riskBadges.nutrition === 'some' ? 'Some concern' : 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS — two equal 48px buttons side by side */}
                <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                  <button
                    onClick={downloadPDFReport}
                    className="flex items-center justify-center gap-2 h-12 bg-[#0F6E56] hover:bg-[#0C5A4C] text-white font-semibold text-[14px] rounded-[10px] transition-colors"
                  >
                    <Download className="h-4 w-4" /> Download PDF report
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center justify-center gap-2 h-12 bg-white hover:bg-[#F0FAF7] text-[#0F6E56] font-semibold text-[14px] rounded-[10px] border-[1.5px] border-[#0F6E56] transition-colors"
                  >
                    <Share2 className="h-4 w-4" /> Share with doctor
                  </button>
                </div>

              </div>
            )}

            {/* INITIAL STATE: NO REPORT YET */}
            {!reportText && !streaming && errorState !== 'insufficient_data' && errorState !== 'api_failure' && (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
                <Brain className="h-12 w-12 text-teal-100 bg-teal-50 rounded-full p-2.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-gray-700">No report generated this week</p>
                  <p className="text-xs text-gray-400 mt-1 leading-normal">
                    Ready to check your 7-day health trends? Hit the button below to stream a complete summary.
                  </p>
                </div>
                <button
                  onClick={() => triggerGenerateAdvice(false)}
                  className="w-full px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Generate Weekly Advice
                </button>
              </div>
            )}

          </div>{/* end body */}
        </div>

      </div>

      {/* ========================================================
          SHARE REPORT MODAL OVERLAY
          ======================================================== */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="h-4.5 w-4.5 text-teal-600" /> Share Health Report
              </h4>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-650 hover:bg-gray-55 p-1 rounded-lg transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div>
              <p className="text-xs text-gray-500 leading-normal mb-4">
                Select a connected physician below. Sharing your report makes your Clinical Doctor Brief instantly accessible in their portal.
              </p>

              {loadingDoctors ? (
                <div className="py-8 text-center flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Loading your connections...</span>
                </div>
              ) : doctorsList.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  You have not connected with any doctors yet. Please update your profile or link a physician first.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {doctorsList.map(doc => (
                    <div key={doc._id} className="p-3 border rounded-lg flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div>
                        <span className="font-bold text-xs text-gray-900 block">{doc.name}</span>
                        <span className="text-[10px] text-gray-500 block">{doc.email}</span>
                      </div>
                      <button
                        onClick={() => shareWithDoctor(doc._id)}
                        disabled={sharingWith !== null}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {sharingWith === doc._id && <Loader2 className="h-3 w-3 animate-spin" />}
                        Share
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
