import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

export default function VitalChart({ data, type, thresholdValue, loading = false }) {
  
  const config = {
    glucose: {
      title: 'Glucose Levels',
      unit: 'mg/dL',
      color: '#0d9488', // Teal-600
      dataKey: 'avg',
      label: 'Avg Glucose'
    },
    bp: {
      title: 'Blood Pressure',
      unit: 'mmHg',
      colorSys: '#ef4444', // Red-500
      colorDia: '#3b82f6', // Blue-500
      dataKeySys: 'avgSys',
      dataKeyDia: 'avgDia',
      labelSys: 'Systolic BP',
      labelDia: 'Diastolic BP'
    },
    heartRate: {
      title: 'Heart Rate',
      unit: 'bpm',
      color: '#ec4899', // Pink-500
      dataKey: 'avg',
      label: 'Avg HR'
    },
    weight: {
      title: 'Weight Trends',
      unit: 'kg',
      color: '#6366f1', // Indigo-500
      dataKey: 'avg',
      label: 'Weight'
    },
    mood: {
      title: 'Mood Tracker',
      unit: '/10',
      color: '#f59e0b', // Amber-500
      dataKey: 'avg',
      label: 'Mood Score'
    }
  };

  const current = config[type] || config.glucose;

  const formatDate = (str) => {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm animate-shimmer h-[350px] w-full flex items-center justify-center">
        <div className="text-gray-400 text-sm font-semibold">Loading chart analytics...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-150 p-6 shadow-sm h-[350px] w-full flex flex-col items-center justify-center text-center">
        <p className="text-gray-400 font-semibold mb-2">No data logs found for this selection.</p>
        <p className="text-xs text-gray-500">Submit a health log to start visualizing your data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">{current.title}</h3>
        <p className="text-xs text-gray-500">Values in {current.unit}</p>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate} 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              stroke="#e5e7eb"
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              stroke="#e5e7eb"
              label={{ value: current.unit, angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: 10 } }}
            />
            <Tooltip
              labelFormatter={formatDate}
              contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontSize: '11px', fontWeight: 600 }}
              labelStyle={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

            {/* Custom line rendering for BP vs standard vitals */}
            {type === 'bp' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="avgSys"
                  name={current.labelSys}
                  stroke={current.colorSys}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgDia"
                  name={current.labelDia}
                  stroke={current.colorDia}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={current.dataKey}
                name={current.label}
                stroke={current.color}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}

            {/* Draw Red Reference Threshold Line if set */}
            {thresholdValue && (
              <ReferenceLine
                y={thresholdValue}
                label={{ value: `Limit (${thresholdValue})`, position: 'top', fill: '#ef4444', fontSize: 9, fontWeight: 700 }}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
