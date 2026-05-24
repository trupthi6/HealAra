import React, { useState, useEffect } from 'react';
import api from '../api';
import VitalChart from './VitalChart';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export default function PatientTrendsView({ patientId, thresholds }) {
  const [period, setPeriod] = useState('week'); // 'week' | 'month' | '3months'
  const [activeTab, setActiveTab] = useState('glucose'); // 'glucose' | 'bp' | 'heartRate' | 'weight' | 'mood'
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ avg: null, min: null, max: null });

  const periods = [
    { id: 'week', label: '1 Week' },
    { id: 'month', label: '1 Month' },
    { id: '3months', label: '3 Months' }
  ];

  const tabs = [
    { id: 'glucose', label: 'Glucose' },
    { id: 'bp', label: 'Blood Pressure' },
    { id: 'heartRate', label: 'Heart Rate' },
    { id: 'weight', label: 'Weight' },
    { id: 'mood', label: 'Mood' }
  ];

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        let data = [];
        const ptParam = patientId ? `&patientId=${patientId}` : '';

        if (activeTab === 'mood') {
          const res = await api.get(`/trends/mood?period=${period}${ptParam}`);
          if (res.data.success) {
            data = res.data.trends;
          }
        } else if (activeTab === 'bp') {
          // Fetch systolic and diastolic in parallel
          const [sysRes, diaRes] = await Promise.all([
            api.get(`/trends/vitals?field=bpSystolic&period=${period}${ptParam}`),
            api.get(`/trends/vitals?field=bpDiastolic&period=${period}${ptParam}`)
          ]);

          if (sysRes.data.success && diaRes.data.success) {
            const sysData = sysRes.data.trends;
            const diaData = diaRes.data.trends;
            const allDates = Array.from(
              new Set([...sysData.map(d => d.date), ...diaData.map(d => d.date)])
            ).sort();

            data = allDates.map(date => {
              const sysItem = sysData.find(d => d.date === date);
              const diaItem = diaData.find(d => d.date === date);
              return {
                date,
                avgSys: sysItem ? sysItem.avg : null,
                avgDia: diaItem ? diaItem.avg : null
              };
            });
          }
        } else {
          // Standard single vitals
          const res = await api.get(`/trends/vitals?field=${activeTab}&period=${period}${ptParam}`);
          if (res.data.success) {
            data = res.data.trends;
          }
        }

        setChartData(data);
        calculateStats(data);
      } catch (err) {
        console.error('Error fetching trend data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [period, activeTab, patientId]);

  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({ avg: null, min: null, max: null });
      return;
    }

    if (activeTab === 'bp') {
      const sysVals = data.map(d => d.avgSys).filter(v => v !== null);
      const diaVals = data.map(d => d.avgDia).filter(v => v !== null);
      
      if (sysVals.length === 0 || diaVals.length === 0) {
        setStats({ avg: null, min: null, max: null });
        return;
      }

      const avgSys = Math.round(sysVals.reduce((a, b) => a + b, 0) / sysVals.length);
      const avgDia = Math.round(diaVals.reduce((a, b) => a + b, 0) / diaVals.length);
      const minSys = Math.min(...sysVals);
      const minDia = Math.min(...diaVals);
      const maxSys = Math.max(...sysVals);
      const maxDia = Math.max(...diaVals);

      setStats({
        avg: `${avgSys}/${avgDia}`,
        min: `${minSys}/${minDia}`,
        max: `${maxSys}/${maxDia}`
      });
    } else {
      const vals = data.map(d => d.avg).filter(v => v !== null);
      if (vals.length === 0) {
        setStats({ avg: null, min: null, max: null });
        return;
      }

      const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
      const min = Math.min(...vals);
      const max = Math.max(...vals);

      setStats({ avg, min, max });
    }
  };

  const getThreshold = () => {
    if (!thresholds) return null;
    if (activeTab === 'glucose') return thresholds.glucoseMax;
    if (activeTab === 'bp') return thresholds.bpSystolicMax;
    if (activeTab === 'heartRate') return thresholds.heartRateMax;
    return null;
  };

  const getUnit = () => {
    if (activeTab === 'glucose') return 'mg/dL';
    if (activeTab === 'bp') return 'mmHg';
    if (activeTab === 'heartRate') return 'bpm';
    if (activeTab === 'weight') return 'kg';
    return '/10';
  };

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Patient Analytics Trends</h2>
          <p className="text-sm text-gray-500 mt-1">Visualize and analyze health parameters over time.</p>
        </div>

        {/* Period Selector Buttons */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-gray-150 shadow-sm self-start sm:self-center">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Primary Chart Area */}
      <VitalChart
        data={chartData}
        type={activeTab}
        thresholdValue={getThreshold()}
        loading={loading}
      />

      {/* Aggregates Summary Row */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Period Summary Statistics</h3>
        
        {loading ? (
          <div className="grid grid-cols-3 gap-4 animate-shimmer h-12">
            <div className="bg-gray-50 rounded"></div>
            <div className="bg-gray-50 rounded"></div>
            <div className="bg-gray-50 rounded"></div>
          </div>
        ) : stats.avg === null ? (
          <p className="text-center text-xs text-gray-400 font-semibold py-2">No stats available for this selection.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Average */}
            <div className="pt-4 sm:pt-0 first:pt-0 sm:first:pl-0 sm:pl-6 text-center sm:text-left">
              <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">Average Reading</span>
              <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-2xl font-bold text-gray-900">{stats.avg}</span>
                <span className="text-xs font-semibold text-gray-450">{getUnit()}</span>
              </div>
            </div>

            {/* Min */}
            <div className="pt-4 sm:pt-0 sm:pl-6 text-center sm:text-left">
              <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">Minimum Recorded</span>
              <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-2xl font-bold text-gray-900">{stats.min}</span>
                <span className="text-xs font-semibold text-gray-450">{getUnit()}</span>
              </div>
            </div>

            {/* Max */}
            <div className="pt-4 sm:pt-0 sm:pl-6 text-center sm:text-left">
              <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">Maximum Recorded</span>
              <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-2xl font-bold text-red-650">{stats.max}</span>
                <span className="text-xs font-semibold text-gray-450">{getUnit()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
