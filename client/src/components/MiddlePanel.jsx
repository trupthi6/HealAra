import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import SparklineChart from './SparklineChart';
import {
  Droplets, Heart, Activity, Smile, Flame,
  Info, Pill, Calendar, Target, ChevronRight
} from 'lucide-react';

const Skeleton = ({ w = 'w-full', h = 'h-4' }) => (
  <div className={`${w} ${h} skeleton rounded`} />
);

export default function MiddlePanel() {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sparklines, setSparklines] = useState({});
  const [meds, setMeds] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, medsRes] = await Promise.all([
          api.get('/trends/summary'),
          api.get('/medications'),
        ]);
        if (sumRes.data.success) setSummary(sumRes.data.summary);
        if (medsRes.data.success) setMeds(medsRes.data.medications || medsRes.data.data || []);
      } catch (e) {
        console.error('MiddlePanel load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Load sparkline data
    async function loadSparklines() {
      try {
        const fields = ['glucose', 'heartRate', 'mood'];
        const results = {};
        await Promise.all(fields.map(async (field) => {
          try {
            const res = await api.get(`/trends/vitals?field=${field}&period=week`);
            const data = res.data?.data || res.data?.vitals || [];
            results[field] = data.map(d => d.avg || d.value || 0).filter(v => v > 0);
          } catch { results[field] = []; }
        }));
        setSparklines(results);
      } catch (e) {}
    }
    loadSparklines();
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const getAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  const age = getAge(user?.dob);
  const condition = user?.conditions?.[0] || 'General Health';
  const activeMeds = meds.filter(m => m.active).length;

  const metrics = [
    {
      icon: Droplets,
      iconColor: 'text-teal-600',
      label: 'Avg Glucose',
      value: summary?.avgGlucose ? `${summary.avgGlucose}` : loading ? null : '—',
      unit: 'mg/dL',
      sub: 'Threshold: 180 mg/dL',
      sparkColor: '#0D9488',
      sparkData: sparklines.glucose,
    },
    {
      icon: Heart,
      iconColor: 'text-pink-500',
      label: 'Blood Pressure',
      value: summary?.avgBpSystolic ? `${summary.avgBpSystolic}/${summary.avgBpDiastolic}` : loading ? null : '—',
      unit: 'mmHg',
      sub: 'Threshold: 140/90 mmHg',
      sparkColor: '#EC4899',
      sparkData: sparklines.bp || [80, 85, 78, 90, 82, 88, 80],
    },
    {
      icon: Activity,
      iconColor: 'text-purple-500',
      label: 'Heart Rate',
      value: summary?.avgHeartRate ? `${summary.avgHeartRate}` : loading ? null : '—',
      unit: 'bpm',
      sub: 'Normal Range: 60–100 bpm',
      sparkColor: '#8B5CF6',
      sparkData: sparklines.heartRate,
    },
    {
      icon: Smile,
      iconColor: 'text-amber-500',
      label: 'Avg Mood Score',
      value: summary?.avgMoodScore ? `${summary.avgMoodScore}` : loading ? null : '—',
      unit: '/10',
      sub: '',
      extra: summary?.avgMoodScore ? 'Good' : null,
      sparkColor: '#F59E0B',
      sparkData: sparklines.mood,
    },
    {
      icon: Flame,
      iconColor: 'text-amber-500',
      label: 'Logging Streak',
      value: summary?.streak !== undefined ? `${summary.streak}` : loading ? null : '0',
      unit: ' Days',
      sub: '',
      extra: summary?.streak > 0 ? 'Great consistency!' : null,
      sparkColor: '#F59E0B',
      sparkData: [1,2,2,3,3,3,4],
    },
  ];

  return (
    <div className="p-5">
      {/* Patient Card */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white text-base font-bold shrink-0"
        >
          {initials}
        </div>
        <div>
          <p className="text-[15px] font-semibold text-slate-900 leading-tight">{user?.name}</p>
          {age && (
            <p className="text-[12px] text-slate-500 mt-0.5">
              {age} years • {user?.gender || 'Male'}
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-0.5">Patient ID: PV-2024-00125</p>
        </div>
      </div>

      {/* Condition Badge */}
      <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 mb-5">
        <p className="text-[14px] font-semibold text-teal-700">{condition}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Condition</p>
      </div>

      {/* Snapshot header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[1px]">
          This Week's Snapshot
        </span>
        <Info size={14} className="text-slate-300" />
      </div>

      {/* Metrics */}
      {metrics.map((m) => (
        <div key={m.label} className="py-3 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5">
              <m.icon size={14} className={m.iconColor} />
              <span className="text-[11px] text-slate-500">{m.label}</span>
            </div>
            {m.value === null ? (
              <div className="mt-1">
                <Skeleton h="h-6" w="w-20" />
              </div>
            ) : (
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[22px] font-bold text-slate-900 leading-none">{m.value}</span>
                <span className="text-[13px] text-slate-500">{m.unit}</span>
              </div>
            )}
            {m.extra && (
              <p className="text-[12px] font-medium text-green-500 mt-0.5">{m.extra}</p>
            )}
            {m.sub && (
              <p className="text-[11px] text-slate-400 mt-0.5">{m.sub}</p>
            )}
          </div>
          <SparklineChart
            data={m.sparkData?.length >= 2 ? m.sparkData : undefined}
            color={m.sparkColor}
            width={56}
            height={32}
          />
        </div>
      ))}

      {/* This Week section */}
      <div className="mt-5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[1px]">This Week</span>

        {[
          {
            icon: Pill,
            iconBg: 'bg-orange-50',
            iconColor: 'text-amber-500',
            label: 'Active Medications',
            value: loading ? '—' : `${activeMeds} Prescriptions`,
          },
          {
            icon: Calendar,
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-500',
            label: 'Upcoming Appointments',
            value: '1 Scheduled',
          },
          {
            icon: Target,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-500',
            label: 'Health Goals',
            value: '3 Active Goals',
          },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-md ${item.iconBg} flex items-center justify-center shrink-0`}>
                <item.icon size={16} className={item.iconColor} />
              </div>
              <div>
                <p className="text-[12px] text-slate-500">{item.label}</p>
                <p className="text-[14px] font-semibold text-slate-900">{item.value}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
