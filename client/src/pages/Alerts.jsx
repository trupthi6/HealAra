import React, { useState, useEffect } from 'react';
import api from '../api';
import AlertBadge from '../components/AlertBadge';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Heart, 
  Pill, 
  Clock, 
  CheckSquare, 
  ShieldAlert 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Alerts() {
  const [unresolvedAlerts, setUnresolvedAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unresolved'); // 'unresolved' | 'resolved'

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      // Fetch both unresolved and history
      const [unresolvedRes, historyRes] = await Promise.all([
        api.get('/alerts'),
        api.get('/alerts/history')
      ]);

      if (unresolvedRes.data.success) {
        setUnresolvedAlerts(unresolvedRes.data.alerts);
      }

      if (historyRes.data.success) {
        // Filter out resolved alerts from history
        const resolved = historyRes.data.alerts.filter(a => a.resolved);
        setResolvedAlerts(resolved);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id) => {
    try {
      const res = await api.patch(`/alerts/${id}/resolve`);
      if (res.data.success) {
        toast.success('Alert marked as resolved.');
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'glucose_high':
        return <Activity className="h-6 w-6 text-red-500" />;
      case 'bp_high':
        return <Heart className="h-6 w-6 text-red-500" />;
      case 'heart_rate_high':
        return <ShieldAlert className="h-6 w-6 text-amber-500" />;
      case 'medication_missed':
        return <Pill className="h-6 w-6 text-blue-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-teal-600" />;
    }
  };

  const formattedDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentAlerts = activeTab === 'unresolved' ? unresolvedAlerts : resolvedAlerts;

  return (
    <div className="space-y-8 max-w-5xl w-full mx-auto py-6">
      {/* Header Panel */}
      <div className="pb-2">
        <h1 className="text-[32px] font-bold text-gray-900 tracking-tight leading-none">Clinical Alerts</h1>
        <p className="text-[15px] text-gray-500 mt-2 font-medium">Review threshold breaches and logs flagged by the anomaly detector.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('unresolved')}
          className={`py-3.5 px-5 font-bold text-[14px] uppercase tracking-wider border-b-2 transition-premium flex items-center gap-2 ${
            activeTab === 'unresolved'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Active Alerts
          {unresolvedAlerts.length > 0 && (
            <span className="bg-red-500 text-white rounded-full text-[11px] px-2 py-0.5 font-bold">
              {unresolvedAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`py-3.5 px-5 font-bold text-[14px] uppercase tracking-wider border-b-2 transition-premium flex items-center gap-2 ${
            activeTab === 'resolved'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Resolved Archive
          {resolvedAlerts.length > 0 && (
            <span className="bg-gray-100 text-gray-600 rounded-full text-[11px] px-2 py-0.5 font-bold border">
              {resolvedAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Alerts Listing */}
      {loading ? (
        <div className="space-y-4">
          <div className="bg-surface-l1 rounded-xl p-6 h-24 animate-shimmer"></div>
          <div className="bg-surface-l1 rounded-xl p-6 h-24 animate-shimmer"></div>
        </div>
      ) : currentAlerts.length === 0 ? (
        <div className="bg-surface-l1 rounded-xl border border-gray-150 p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
          <h3 className="font-bold text-gray-800 text-base">
            {activeTab === 'unresolved' ? 'All clear — no active alerts' : 'No resolved alerts found'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === 'unresolved' 
              ? 'Clinical indicators are well within limits.' 
              : 'There are no historically resolved warning logs.'}
          </p>
        </div>
      ) : (
          <div className="space-y-4">
          {currentAlerts.map((alert) => (
            <div 
              key={alert._id} 
              className={`bg-white rounded-2xl p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-premium hover:-translate-y-[1px] shadow-sm ${
                alert.resolved ? 'border-gray-200' : 'border-red-100 hover:border-red-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-50 rounded-xl shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold text-gray-700 capitalize">
                      {alert.type.replace('_', ' ')}
                    </span>
                    <AlertBadge severity={alert.resolved ? 'resolved' : alert.severity} />
                  </div>
                  <p className="text-[15px] font-medium text-gray-800 leading-normal">{alert.message}</p>
                  
                  {/* Timestamp */}
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-400 font-semibold uppercase tracking-wider">
                    <Clock className="h-4 w-4" />
                    <span>{formattedDate(alert.createdAt)}</span>
                    {alert.logId && (
                      <span className="text-gray-300"> • Log ID: {alert.logId._id || alert.logId}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Resolve Trigger Button */}
              {!alert.resolved && (
                <button
                  onClick={() => handleResolve(alert._id)}
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 font-semibold text-[14px] px-5 py-3 rounded-xl transition-premium shrink-0 self-start sm:self-center hover:-translate-y-[1px] shadow-sm"
                >
                  <CheckSquare className="h-5 w-5" />
                  Resolve Alert
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
