import React from 'react';
import { Clock, Calendar, CheckCircle2, AlertCircle, Edit, Trash2, PowerOff } from 'lucide-react';

export default function MedicationCard({ medication, onEdit, onDeactivate, onDelete }) {
  const { name, dosage, frequency, startDate, reminderTime, active } = medication;

  const frequencyLabels = {
    daily: 'Once Daily',
    twice_daily: 'Twice Daily',
    weekly: 'Weekly',
    as_needed: 'As Needed'
  };

  const formattedDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all duration-200 ${active ? 'border-teal-100 hover:border-teal-200' : 'border-gray-200 opacity-60 bg-gray-50'}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-gray-800">{name}</h3>
            {active ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-150">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-250">
                <PowerOff className="h-3 w-3" /> Inactive
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-teal-600 mt-1">{dosage || 'No dosage specified'}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {active && onEdit && (
            <button
              onClick={() => onEdit(medication)}
              className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              title="Edit Medication"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {active && onDeactivate && (
            <button
              onClick={() => onDeactivate(medication._id)}
              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Deactivate Medication"
            >
              <PowerOff className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(medication._id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Medication"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-500 shrink-0" />
          <div>
            <span className="block text-[10px] text-gray-400 font-semibold uppercase">Schedule</span>
            <span className="font-medium text-gray-700">{frequencyLabels[frequency] || frequency}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-500 shrink-0" />
          <div>
            <span className="block text-[10px] text-gray-400 font-semibold uppercase">Reminder</span>
            <span className="font-medium text-gray-700">{reminderTime || 'Not set'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 col-span-2">
          <Calendar className="h-4 w-4 text-teal-500 shrink-0" />
          <div>
            <span className="block text-[10px] text-gray-400 font-semibold uppercase">Start Date</span>
            <span className="font-medium text-gray-700">{formattedDate(startDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
