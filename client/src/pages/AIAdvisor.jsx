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
      if (trimmed.startsWith('## Weekly Overview')) {
        sections.overview = trimmed.replace('## Weekly Overview', '').trim();
      } else if (trimmed.startsWith('## Physical Health')) {
        sections.physical = trimmed;
      } else if (trimmed.startsWith('## Mental Wellness')) {
        sections.mental = trimmed;
      } else if (trimmed.startsWith('## Nutrition Guide')) {
        sections.nutrition = trimmed;
      } else if (trimmed.startsWith('## Lifestyle & Habits') || trimmed.startsWith('## Lifestyle')) {
        sections.lifestyle = trimmed;
      } else if (trimmed.startsWith('## Medication Reminder') || trimmed.startsWith('## Medication')) {
        sections.medication = trimmed;
      } else if (trimmed.startsWith('## Keep Going')) {
        sections.keepGoing = trimmed.replace('## Keep Going', '').trim();
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
    <div className="space-y-6">
      
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="h-7 w-7 text-teal-600 animate-pulse" /> 360° AI Health Advisor
        </h1>
        <p className="text-xs text-gray-500 mt-1">Tailored physical, mental, and nutritional advice powered by Claude</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ========================================================
            LEFT COLUMN PANEL: WEEKLY SNAPSHOT
            ======================================================== */}
        <div className="w-full lg:w-72 shrink-0 space-y-4 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
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
            <div className="space-y-4 divide-y divide-gray-50">
              
              {/* Avg Glucose Card */}
              <div className="pt-3 first:pt-0">
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
              <div className="pt-3">
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
                  <span className="text-base font-bold text-gray-900">{snapshot.streak} Days Logged</span>
                </div>
              </div>

              {/* Top Symptoms Tags */}
              <div className="pt-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Symptoms This Week</span>
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
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Medications</span>
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
        <div className="flex-1 w-full bg-white border border-gray-100 rounded-xl p-6 shadow-sm min-w-0 space-y-4">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5.5 w-5.5 text-teal-600" />
              <div>
                <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">Weekly Health Analysis</h3>
                {isCached && cachedTime && (
                  <span className="text-[10px] text-gray-400 block font-semibold mt-0.5">
                    Generated {Math.max(0, Math.round((new Date() - cachedTime) / (60 * 60 * 1000)))}h ago (24h cache active)
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 self-stretch sm:self-auto">
              {isCached && reportText && (
                <button
                  onClick={() => triggerGenerateAdvice(true)}
                  disabled={streaming}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold text-teal-600 border-teal-150 hover:bg-teal-50/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${streaming ? 'animate-spin' : ''}`} /> Regenerate
                </button>
              )}

              {!reportText && !streaming && errorState !== 'insufficient_data' && (
                <button
                  onClick={() => triggerGenerateAdvice(false)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Generate AI advice
                </button>
              )}
            </div>
          </div>

          {/* Clinician Annotation Banner (if doctor left a note) */}
          {showAnnotation && (user?.doctorAnnotation || user?.prevDoctorAnnotation) && (
            <div className={`p-4 border-l-4 rounded-r-xl flex items-start justify-between ${
              user.doctorAnnotation ? 'border-teal-500 bg-teal-50/20' : 'border-gray-350 bg-gray-50/40'
            }`}>
              <div className="space-y-1">
                <h4 className={`text-[10px] font-bold uppercase tracking-wider ${
                  user.doctorAnnotation ? 'text-teal-800' : 'text-gray-500'
                }`}>
                  {user.doctorAnnotation 
                    ? `Message from Dr. ${user.doctorAnnotationBy || 'Doctor'}` 
                    : 'Note from a previous report'
                  }
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

          {/* ========================================================
              DISPLAY VIEWS BASED ON REPORT ADVICE STATE
              ======================================================== */}
          
          {/* STREAMING / GENERATING STATE VIEW */}
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

          {/* ERROR / INSUFFICIENT DATA STATES */}
          {!streaming && errorState === 'insufficient_data' && (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
              <AlertCircle className="h-10 w-10 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-gray-700">Insufficient Vitals History</p>
                <p className="text-xs text-gray-400 mt-1.5 leading-normal">
                  You need to record vitals for at least 3 days in the past week to unlock Claude's AI clinical summaries and coach reports.
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
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 mx-auto shadow-xs"
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          )}

          {/* STREAM INTERRUPTED / PARTIAL OUTPUT WARN BANNER */}
          {!streaming && errorState === 'interrupted' && reportText && (
            <div className="p-4 border-l-4 border-amber-500 bg-amber-50/20 rounded-r-xl flex items-start justify-between">
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

          {/* COMPLETED REPORT AND METRIC VIEWS */}
          {reportText && (
            <div className="space-y-6">
              
              {/* Warm Summary Section */}
              {parsedSections.overview && (
                <div className="p-4 bg-teal-50/10 border border-teal-50 rounded-xl">
                  <p className="text-sm text-gray-800 leading-relaxed font-medium italic">
                    "{parsedSections.overview}"
                  </p>
                </div>
              )}

              {/* Tabs Switcher for Sections */}
              <div className="border-b flex overflow-x-auto gap-2 scrollbar-none">
                {[
                  { id: 'physical', label: 'Physical Health', icon: Activity },
                  { id: 'mental', label: 'Mental Wellness', icon: Smile },
                  { id: 'nutrition', label: 'Nutrition Guide', icon: Brain },
                  { id: 'lifestyle', label: 'Lifestyle & Habits', icon: TrendingUp },
                  { id: 'medication', label: 'Medications', icon: Pill }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 text-xs font-bold uppercase whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? 'border-teal-600 text-teal-600'
                          : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ========================================================
                  TAB VIEW COMPONENT LAYOUTS
                  ======================================================== */}
              <div className="min-h-[250px] animate-fadeIn">
                
                {/* 1. PHYSICAL HEALTH TAB */}
                {activeTab === 'physical' && parsedSections.physical && (
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
                    <ReactMarkdown>{parsedSections.physical}</ReactMarkdown>
                  </div>
                )}

                {/* 2. MENTAL WELLNESS TAB */}
                {activeTab === 'mental' && parsedSections.mental && (
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
                    <ReactMarkdown>{parsedSections.mental}</ReactMarkdown>
                  </div>
                )}

                {/* 3. NUTRITION GUIDE TAB (Custom design layout) */}
                {activeTab === 'nutrition' && parsedSections.nutrition && (
                  <div className="space-y-5">
                    {nutritionLayout.eatMore.length > 0 || nutritionLayout.avoid.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Eat More cards */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-emerald-650 uppercase tracking-wider flex items-center gap-1">
                            <span className="h-2 w-2 bg-emerald-500 rounded-full"></span> Foods to eat more of
                          </h4>
                          <div className="space-y-2">
                            {nutritionLayout.eatMore.map((item, idx) => (
                              <div key={idx} className="p-3 border-l-[3px] border-emerald-500 bg-white border border-gray-150 rounded-r-lg shadow-2xs">
                                <span className="font-bold text-xs text-gray-900 block">{item.food}</span>
                                <span className="text-xs text-gray-500 block mt-0.5 leading-normal">{item.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Reduce/Avoid cards */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                            <span className="h-2 w-2 bg-red-500 rounded-full"></span> Foods to reduce or avoid
                          </h4>
                          <div className="space-y-2">
                            {nutritionLayout.avoid.map((item, idx) => (
                              <div key={idx} className="p-3 border-l-[3px] border-red-500 bg-white border border-gray-150 rounded-r-lg shadow-2xs">
                                <span className="font-bold text-xs text-gray-900 block">{item.food}</span>
                                <span className="text-xs text-gray-500 block mt-0.5 leading-normal">{item.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ) : (
                      // Fallback if parsing didn't match the format
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                        <ReactMarkdown>{parsedSections.nutrition}</ReactMarkdown>
                      </div>
                    )}

                    {/* Meal Timing Tip Info Banner */}
                    {nutritionLayout.mealTiming && (
                      <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs text-amber-800 uppercase tracking-wider block">Meal Timing Tip</span>
                          <span className="text-xs text-gray-800 block mt-1 leading-relaxed">{nutritionLayout.mealTiming}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. LIFESTYLE & HABITS TAB (Custom design layout) */}
                {activeTab === 'lifestyle' && parsedSections.lifestyle && (
                  <div className="space-y-5">
                    {lifestyleLayout.build.length > 0 || lifestyleLayout.reduce.length > 0 ? (
                      <div className="space-y-4">
                        {/* Build Checklist */}
                        {lifestyleLayout.build.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Build These Habits</h4>
                            <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden bg-white shadow-2xs">
                              {lifestyleLayout.build.map((habit, idx) => (
                                <div key={idx} className="p-3 flex items-start gap-3">
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span className="text-xs text-gray-750 leading-relaxed font-semibold">{habit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reduce checklist */}
                        {lifestyleLayout.reduce.length > 0 && (
                          <div className="space-y-2.5 pt-1">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Habits to Reduce</h4>
                            <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden bg-white shadow-2xs">
                              {lifestyleLayout.reduce.map((habit, idx) => (
                                <div key={idx} className="p-3 flex items-start gap-3">
                                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                  <span className="text-xs text-gray-750 leading-relaxed font-semibold">{habit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Highlight Focus Card */}
                        {lifestyleLayout.focus && (
                          <div className="p-5 bg-teal-600 rounded-xl text-white shadow-md relative overflow-hidden">
                            <Brain className="absolute right-4 bottom-2 h-20 w-20 text-teal-500 opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100 block">This Week's One Focus</span>
                            <h4 className="text-sm font-bold mt-2 leading-relaxed max-w-md">{lifestyleLayout.focus}</h4>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                        <ReactMarkdown>{parsedSections.lifestyle}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. MEDICATION REMINDER TAB */}
                {activeTab === 'medication' && parsedSections.medication && (
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
                    <ReactMarkdown>{parsedSections.medication}</ReactMarkdown>
                  </div>
                )}

              </div>

              {/* Keep Going encouraging bottom block */}
              {parsedSections.keepGoing && (
                <div className="p-4 bg-emerald-50/10 border border-emerald-50 rounded-xl border-dashed">
                  <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                    🌟 {parsedSections.keepGoing}
                  </p>
                </div>
              )}

              {/* ========================================================
                  RISK INDICATOR ROW (Always visible after generation)
                  ======================================================== */}
              <div className="border-t pt-5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                  AI Clinical Flag Summaries (Calculated)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Physical Risk */}
                  <div className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Physical Risk</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                      riskBadges.physical === 'high' 
                        ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                        : riskBadges.physical === 'moderate'
                          ? 'bg-amber-50 text-amber-700 border-amber-250'
                          : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {riskBadges.physical}
                    </span>
                  </div>

                  {/* Mental Risk */}
                  <div className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Mental Wellness</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                      riskBadges.mental === 'concern'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : riskBadges.mental === 'watch'
                          ? 'bg-amber-50 text-amber-700 border-amber-250'
                          : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {riskBadges.mental === 'concern' ? 'High Concern' : riskBadges.mental}
                    </span>
                  </div>

                  {/* Nutrition Alert */}
                  <div className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Nutrition Alert</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                      riskBadges.nutrition === 'review'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : riskBadges.nutrition === 'some'
                          ? 'bg-amber-50 text-amber-700 border-amber-250'
                          : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {riskBadges.nutrition === 'review' ? 'Review Needed' : riskBadges.nutrition === 'some' ? 'Some' : 'None'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Action Buttons (Bottom row) */}
              <div className="border-t pt-5 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadPDFReport}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  <Download className="h-4.5 w-4.5" /> Download My Report PDF
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-colors"
                >
                  <Share2 className="h-4.5 w-4.5" /> Share with My Doctor
                </button>
              </div>

            </div>
          )}

          {/* INITIAL STATE: NO REPORT YET */}
          {!reportText && !streaming && errorState !== 'insufficient_data' && (
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
