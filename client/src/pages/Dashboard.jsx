import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import AlertBadge from '../components/AlertBadge';
import { 
  Plus, 
  Flame, 
  Heart, 
  Activity, 
  Smile, 
  AlertTriangle, 
  Pill, 
  TrendingUp, 
  Calendar,
  FileDown,
  Brain,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine
} from 'recharts';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ streak: 0, totalLogs: 0 });
  const [showUrgentBanner, setShowUrgentBanner] = useState(true);
  const [latestLog, setLatestLog] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [medications, setMedications] = useState([]);
  const [glucoseChartData, setGlucoseChartData] = useState([]);
  const [completedMeds, setCompletedMeds] = useState(() => {
    // Persist checked medications for today in localStorage
    const saved = localStorage.getItem(`completed_meds_${new Date().toDateString()}`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data in parallel
        const [summaryRes, logsRes, alertsRes, medsRes, trendsRes] = await Promise.all([
          api.get('/trends/summary'),
          api.get('/logs?limit=5'),
          api.get('/alerts'),
          api.get('/medications'),
          api.get('/trends/vitals?field=glucose&period=week')
        ]);

        if (summaryRes.data.success) setSummary(summaryRes.data.summary);
        if (logsRes.data.success && logsRes.data.logs.length > 0) {
          setLatestLog(logsRes.data.logs[0]);
        }
        if (alertsRes.data.success) setAlerts(alertsRes.data.alerts.slice(0, 3));
        if (medsRes.data.success) setMedications(medsRes.data.medications);
        if (trendsRes.data.success) setGlucoseChartData(trendsRes.data.trends);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleMedToggle = (medId, medName) => {
    const updated = {
      ...completedMeds,
      [medId]: !completedMeds[medId]
    };
    setCompletedMeds(updated);
    localStorage.setItem(`completed_meds_${new Date().toDateString()}`, JSON.stringify(updated));
    
    if (updated[medId]) {
      toast.success(`Marked ${medName} as taken!`);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Format date helper for the chart X-axis
  const formatChartDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const downloadPDF = async () => {
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

  const renderTrendArrow = (field) => {
    const trend = summary?.trends?.[field];
    if (!trend || trend.status === 'stable') return null;
    const isImproving = trend.status === 'improving';
    const arrow = isImproving ? '↑' : '↓';
    const color = isImproving ? 'text-green-500' : 'text-red-500';
    return (
      <span className={`text-sm font-extrabold ml-1.5 align-middle ${color}`} title={isImproving ? 'Improving trend vs last week' : 'Worsening trend vs last week'}>
        {arrow}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Urgent consultation red alert banner */}
      {user?.consultationUrgency === 'urgent' && showUrgentBanner && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <span className="text-xs font-semibold">Your doctor has flagged your recent report for urgent review. Contact your doctor soon.</span>
          </div>
          <button 
            onClick={() => setShowUrgentBanner(false)} 
            className="text-red-500 hover:text-red-750 p-1 rounded-lg hover:bg-red-100/40 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {getGreeting()}, {user?.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here is a quick overview of your health status today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/log"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="h-4.5 w-4.5" />
            Quick Log Vitals
          </Link>
          
          <Link
            to="/advisor"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-teal-600 border border-teal-200 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <Brain className="h-4.5 w-4.5 text-teal-600" />
            Get AI Health Report
          </Link>

          <button
            onClick={downloadPDF}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-55 text-teal-650 border border-teal-200 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <FileDown className="h-4.5 w-4.5" />
            Report PDF
          </button>
        </div>
      </div>

      {/* Grid of 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Latest Glucose"
          value={latestLog?.vitals?.glucose !== undefined && latestLog?.vitals?.glucose !== null ? <>{latestLog.vitals.glucose}{renderTrendArrow('glucose')}</> : null}
          unit="mg/dL"
          label={latestLog ? `Logged ${new Date(latestLog.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No logs recorded'}
          icon={Activity}
          color={latestLog?.vitals?.glucose > (user?.thresholds?.glucoseMax || 180) ? 'red' : 'teal'}
          loading={loading}
        />
        <StatCard
          title="Latest Blood Pressure"
          value={latestLog?.vitals?.bpSystolic && latestLog?.vitals?.bpDiastolic ? <>{latestLog.vitals.bpSystolic}/{latestLog.vitals.bpDiastolic}{renderTrendArrow('bp')}</> : null}
          unit="mmHg"
          label={latestLog ? `Source: ${latestLog.source}` : 'No logs recorded'}
          icon={Heart}
          color={latestLog?.vitals?.bpSystolic > (user?.thresholds?.bpSystolicMax || 140) ? 'red' : 'indigo'}
          loading={loading}
        />
        <StatCard
          title="Mood Rating"
          value={latestLog?.moodScore !== undefined && latestLog?.moodScore !== null ? <>{latestLog.moodScore}{renderTrendArrow('mood')}</> : null}
          unit="/10"
          label={latestLog?.notes ? `"${latestLog.notes.slice(0, 30)}..."` : 'No mood logged'}
          icon={Smile}
          color="amber"
          loading={loading}
        />
        <StatCard
          title="Daily Streak"
          value={summary.streak}
          unit="Days"
          label={summary.streak > 0 ? "You're on a roll! Keep it up." : "Log vitals to start a streak."}
          icon={Flame}
          color="green"
          loading={loading}
        />
      </div>

      {/* Two Column Section: Chart and Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Glucose Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-800 text-base">Glucose Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 recorded logs</p>
            </div>
            <Link to="/trends" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View Detailed Trends <TrendingUp className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="h-[220px] bg-gray-50 animate-shimmer rounded-xl flex items-center justify-center text-gray-400 text-xs">
              Loading trends...
            </div>
          ) : glucoseChartData.length === 0 ? (
            <div className="h-[220px] bg-gray-50 rounded-xl flex flex-col items-center justify-center text-center p-4">
              <Activity className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 font-semibold">No vitals logged this week.</p>
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={glucoseChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatChartDate} 
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    stroke="#e5e7eb"
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    stroke="#e5e7eb"
                  />
                  <Tooltip
                    labelFormatter={formatChartDate}
                    contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #f3f4f6' }}
                    itemStyle={{ fontSize: '11px', color: '#0d9488', fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  {user?.thresholds?.glucoseMax && (
                    <ReferenceLine
                      y={user.thresholds.glucoseMax}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: `Limit (${user.thresholds.glucoseMax})`, position: 'top', fill: '#ef4444', fontSize: 8, fontWeight: 700 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Side Panels (1 Col): Alerts and Medications */}
        <div className="space-y-6">
          
          {/* Alerts Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Recent Alerts
              </h3>
              <Link to="/alerts" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-12 bg-gray-50 rounded-lg animate-shimmer"></div>
                <div className="h-12 bg-gray-50 rounded-lg animate-shimmer"></div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-xs text-green-600 font-semibold">All clear - no active alerts!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div 
                    key={alert._id} 
                    className={`p-3 rounded-lg border flex flex-col gap-1.5 ${
                      alert.severity === 'critical' 
                        ? 'bg-red-50 border-red-150' 
                        : 'bg-amber-50 border-amber-150'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        alert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'
                      }`}>
                        {alert.type.replace('_', ' ')}
                      </span>
                      <AlertBadge severity={alert.severity} />
                    </div>
                    <p className="text-xs text-gray-700 font-medium leading-normal">{alert.message}</p>
                    <span className="text-[9px] text-gray-400">
                      {new Date(alert.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medications Checklist */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-1.5">
                <Pill className="h-5 w-5 text-teal-600" />
                Medications Today
              </h3>
              <Link to="/medications" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                Manage
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-10 bg-gray-50 rounded-lg animate-shimmer"></div>
                <div className="h-10 bg-gray-50 rounded-lg animate-shimmer"></div>
              </div>
            ) : medications.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 font-semibold">No active medications scheduled.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {medications.map((med) => (
                  <label 
                    key={med._id} 
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      completedMeds[med._id]
                        ? 'bg-teal-50 border-teal-150 text-teal-800 line-through opacity-70'
                        : 'bg-white border-gray-200 text-gray-750 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!completedMeds[med._id]}
                        onChange={() => handleMedToggle(med._id, med.name)}
                        className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold block">{med.name}</span>
                        <span className="text-[10px] text-gray-400 block font-medium">{med.dosage} • {med.reminderTime}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
