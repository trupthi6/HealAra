import React, { useEffect, useState } from 'react';
import { Pill } from 'lucide-react';
import api from '../../api';

export default function MedicationsTab() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/medications')
      .then(res => {
        const data = res.data?.medications || res.data?.data || [];
        setMeds(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = meds.filter(m => m.active);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Pill size={20} className="text-teal-600" />
        <h2 className="text-[18px] font-semibold text-slate-900">Your Medications</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-[10px]" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="py-10 text-center">
          <Pill size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No active medications found.</p>
        </div>
      ) : (
        active.map(med => (
          <div key={med._id} className="bg-white border border-slate-200 rounded-[10px] p-4 mb-2 flex items-start justify-between">
            <div>
              <p className="text-[14px] font-semibold text-slate-900">{med.name}</p>
              <p className="text-[13px] text-slate-500 mt-1">{med.dosage} • {med.frequency}</p>
              {med.startDate && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Since {new Date(med.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            <span className="bg-teal-50 text-teal-600 border border-teal-100 text-[11px] font-semibold px-2 py-0.5 rounded-full ml-3 shrink-0">
              Active
            </span>
          </div>
        ))
      )}
    </div>
  );
}
