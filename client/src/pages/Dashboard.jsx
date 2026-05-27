import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import {
  Download, Sparkles, RefreshCw,
  Activity, Brain, Leaf, TrendingUp, Pill,
  Droplets, Footprints, Moon, Weight,
  UtensilsCrossed, Zap, ChevronRight, Target
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import ProgressBar from '../components/ProgressBar';
import PhysicalHealthTab from './DashboardTabs/PhysicalHealthTab';
import MentalWellnessTab from './DashboardTabs/MentalWellnessTab';
import NutritionGuideTab from './DashboardTabs/NutritionGuideTab';
import LifestyleHabitsTab from './DashboardTabs/LifestyleHabitsTab';
import MedicationsTab from './DashboardTabs/MedicationsTab';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function parseSection(text, header) {
  if (!text) return '';
  const parts = text.split(/(?=## )/);
  const found = parts.find(p => p.trim().startsWith(`## ${header}`));
  return found ? found.replace(`## ${header}`, '').trim() : '';
}

function getFirstParagraph(text) {
  if (!text) return '';
  const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('-'));
  return lines[0] || '';
}

function getKeepGoing(text) {
  const section = parseSection(text, 'Keep Going');
  return section.replace(/^["']|["']$/g, '').trim();
}

const Skeleton = ({ h = 'h-4', w = 'w-full' }) => (
  <div className={`${h} ${w} skeleton rounded`} />
);

const TABS = [
  { id: 'physical',   label: 'Physical Health',   icon: Activity   },
  { id: 'mental',     label: 'Mental Wellness',    icon: Brain      },
  { id: 'nutrition',  label: 'Nutrition Guide',    icon: Leaf       },
  { id: 'lifestyle',  label: 'Lifestyle & Habits', icon: TrendingUp },
  { id: 'medication', label: 'Medications',        icon: Pill       },
];

export default function Dashboard() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('physical');
  const [trendData, setTrendData] = useState([]);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [meds, setMeds] = useState([]);
  const [latestLog, setLatestLog] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(user?.aiAdvice || '');
  const [loadingAI, setLoadingAI] = useState(!user?.aiAdvice);
  const abortController = useRef(null);

  const firstName = user?.name?.split(' ')[0] || 'there';

  /* ── Load AI advice (cached) ── */
  useEffect(() => {
    if (user?.aiAdvice) {
      setAiAdvice(user.aiAdvice);
      setLoadingAI(false);
      return;
    }
    api.get('/advisor/weekly-advice')
      .then(res => {
        if (res.data.success && res.data.cached) {
          setAiAdvice(res.data.aiAdvice || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAI(false));
  }, []);

  /* ── Load trend chart ── */
  useEffect(() => {
    api.get('/trends/vitals?field=glucose&period=week')
      .then(res => {
        const raw = res.data?.data || res.data?.vitals || [];
        const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const formatted = raw.map((d, i) => ({
          day: dayLabels[i] || `D${i + 1}`,
          glucose: Math.round(d.avg || d.value || 0),
        })).filter(d => d.glucose > 0);
        setTrendData(formatted);
      })
      .catch(() => {})
      .finally(() => setLoadingTrend(false));
  }, []);

  /* ── Load medications ── */
  useEffect(() => {
    api.get('/medications')
      .then(res => {
        const data = res.data?.medications || res.data?.data || [];
        setMeds(data.filter(m => m.active));
      })
      .catch(() => {});
  }, []);

  /* ── Load latest log for bottom cards ── */
  useEffect(() => {
    api.get('/logs?limit=1')
      .then(res => {
        const logs = res.data?.logs || res.data?.data || [];
        if (logs.length > 0) setLatestLog(logs[0]);
      })
      .catch(() => {});
  }, []);

  /* ── Regenerate AI advice ── */
  const handleRegenerate = async () => {
    setLoadingAI(true);
    setAiAdvice('');
    abortController.current = new AbortController();
    try {
      const baseUrl = api.defaults.baseURL || '/api';
      const response = await fetch(`${baseUrl}/advisor/weekly-advice?force=true`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: abortController.current.signal
      });
      if (!response.ok) {
        toast.error('Could not regenerate — try again later.');
        setLoadingAI(false);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
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
            if (dataStr === '[DONE]' || dataStr === '[ERROR]') {
              setLoadingAI(false);
              return;
            }
            fullText += dataStr;
            setAiAdvice(fullText);
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('Failed to generate advice.');
    } finally {
      setLoadingAI(false);
    }
  };

  const overviewText = getFirstParagraph(aiAdvice);
  const keepGoingText = getKeepGoing(aiAdvice);

  /* ── Bottom metric cards data ── */
  const weight = latestLog?.vitals?.weight;
  const waterIntake = latestLog?.vitals?.waterIntake;
  const steps = latestLog?.vitals?.steps;
  const sleep = latestLog?.vitals?.sleep;

  return (
    <div className="p-7 pb-20 md:pb-7 max-w-none" style={{ minHeight: 'calc(100vh - 56px)' }}>

      {/* 4A — Header row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 leading-tight">
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">Here's your health overview and insights for today.</p>
        </div>
        <button className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg px-4 py-2 text-[14px] font-medium text-slate-600 transition-colors shadow-card shrink-0 ml-4">
          <Download size={16} className="text-slate-500" />
          Export Report
        </button>
      </div>

      {/* 4B — AI Health Summary */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 mb-5 flex items-start justify-between gap-4 shadow-card">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={16} className="text-teal-600" />
            <span className="text-[14px] font-semibold text-teal-600">AI Health Summary</span>
          </div>
          {loadingAI ? (
            <div className="space-y-2">
              <Skeleton h="h-3.5" w="w-full" />
              <Skeleton h="h-3.5" w="w-4/5" />
            </div>
          ) : overviewText ? (
            <p className="text-[14px] text-slate-700 italic leading-relaxed">
              "{overviewText}"
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-[14px] text-slate-400 italic">Generate your first AI health report to see personalised insights.</p>
              <button
                onClick={() => navigate('/advisor')}
                className="shrink-0 text-[13px] font-medium text-teal-600 hover:underline"
              >
                Generate Report →
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleRegenerate}
          disabled={loadingAI}
          className="shrink-0 flex items-center gap-1.5 bg-white border-[1.5px] border-teal-600 hover:bg-teal-50 rounded-lg px-3.5 py-2 text-[13px] font-medium text-teal-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loadingAI ? 'animate-spin' : ''} />
          Regenerate Analysis
        </button>
      </div>

      {/* 4C — Tab nav */}
      <div className="border-b border-slate-200 flex overflow-x-auto scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-5 py-3 text-[14px] font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
            }`}
          >
            <Icon size={14} className={activeTab === id ? 'text-teal-600' : 'text-slate-400'} />
            {label}
          </button>
        ))}
      </div>

      {/* 4D — Tab content */}
      <div className="flex gap-6 mt-6">
        {/* LEFT — Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'physical' && (
            <PhysicalHealthTab aiAdvice={aiAdvice} keepGoing={keepGoingText} loading={loadingAI} />
          )}
          {activeTab === 'mental' && (
            <MentalWellnessTab aiAdvice={aiAdvice} loading={loadingAI} />
          )}
          {activeTab === 'nutrition' && (
            <NutritionGuideTab aiAdvice={aiAdvice} loading={loadingAI} />
          )}
          {activeTab === 'lifestyle' && (
            <LifestyleHabitsTab aiAdvice={aiAdvice} loading={loadingAI} />
          )}
          {activeTab === 'medication' && (
            <MedicationsTab />
          )}
        </div>

        {/* RIGHT — Chart + Today's Focus (always visible) */}
        <div className="hidden xl:flex flex-col gap-4" style={{ width: 300, flexShrink: 0 }}>

          {/* Health Trend Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-semibold text-slate-900">Health Trend</span>
              <select className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[12px] text-slate-600 outline-none cursor-pointer">
                <option>This Week</option>
              </select>
            </div>
            {loadingTrend ? (
              <div className="h-40 skeleton rounded-lg" />
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeOpacity={0.1} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 200]}
                    ticks={[0, 50, 100, 150, 200]}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                    formatter={(v) => [`${v} mg/dL`, 'Glucose']}
                  />
                  <Line
                    type="monotone"
                    dataKey="glucose"
                    stroke="#0D9488"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-slate-400 text-xs">No glucose data this week</p>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-0.5 bg-teal-600 rounded" />
              <span className="text-[11px] text-slate-500">Glucose (mg/dL)</span>
            </div>
          </div>

          {/* Today's Focus */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center">
                <Target size={16} className="text-amber-500" />
              </div>
              <span className="text-[14px] font-semibold text-slate-900">Today's Focus</span>
            </div>
            {[
              {
                icon: UtensilsCrossed,
                iconBg: 'bg-teal-50',
                iconColor: 'text-teal-600',
                title: 'Log your meals',
                sub: 'Stay on track with nutrition',
              },
              {
                icon: Pill,
                iconBg: 'bg-purple-50',
                iconColor: 'text-purple-500',
                title: 'Take your medication',
                sub: `${meds.length} medication${meds.length !== 1 ? 's' : ''} due`,
              },
              {
                icon: Zap,
                iconBg: 'bg-amber-50',
                iconColor: 'text-amber-500',
                title: 'Activity goal',
                sub: '6,000 steps • 30 mins walk',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 py-2.5 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 -mx-1 px-1 rounded-lg transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                  <item.icon size={15} className={item.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5 truncate">{item.sub}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4E — Bottom metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        {/* Water Intake */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-1.5">
            <Droplets size={15} className="text-teal-600" />
            <span className="text-[12px] text-slate-500">Water Intake</span>
          </div>
          <p className="text-[20px] font-bold text-slate-900 mt-1.5">
            {waterIntake ? `${waterIntake} / 2.5 L` : '2.1 / 2.5 L'}
          </p>
          <ProgressBar
            value={waterIntake || 2.1}
            max={2.5}
            color="#0D9488"
            label="84% of daily goal"
          />
        </div>

        {/* Steps */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-1.5">
            <Footprints size={15} className="text-amber-500" />
            <span className="text-[12px] text-slate-500">Steps</span>
          </div>
          <p className="text-[20px] font-bold text-slate-900 mt-1.5">
            {steps ? `${steps.toLocaleString()} / 6,000` : '4,320 / 6,000'}
          </p>
          <ProgressBar
            value={steps || 4320}
            max={6000}
            color="#F59E0B"
            label="72% of daily goal"
          />
        </div>

        {/* Sleep */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-1.5">
            <Moon size={15} className="text-purple-500" />
            <span className="text-[12px] text-slate-500">Sleep</span>
          </div>
          <p className="text-[20px] font-bold text-slate-900 mt-1.5">
            {sleep ? `${Math.floor(sleep)}h ${Math.round((sleep % 1) * 60)}m` : '6h 45m'}
          </p>
          <p className="text-[12px] font-medium text-green-500 mt-1">Good</p>
        </div>

        {/* Weight */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-1.5">
            <Weight size={15} className="text-slate-500" />
            <span className="text-[12px] text-slate-500">Weight</span>
          </div>
          <p className="text-[20px] font-bold text-slate-900 mt-1.5">
            {weight ? `${weight} kg` : '72.4 kg'}
          </p>
          <p className="text-[12px] font-medium text-green-500 mt-1">-1.2 kg this month</p>
        </div>
      </div>
    </div>
  );
}
