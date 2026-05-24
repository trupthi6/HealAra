import React, { useState, useEffect } from 'react';
import api from '../api';
import MedicationCard from '../components/MedicationCard';
import { Plus, X, Pill, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminderTime, setReminderTime] = useState('08:00');

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medications');
      if (res.data.success) {
        setMedications(res.data.medications);
      }
    } catch (err) {
      console.error('Error fetching medications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const openAddModal = () => {
    setEditingMed(null);
    setName('');
    setDosage('');
    setFrequency('daily');
    setStartDate(new Date().toISOString().split('T')[0]);
    setReminderTime('08:00');
    setShowModal(true);
  };

  const openEditModal = (med) => {
    setEditingMed(med);
    setName(med.name);
    setDosage(med.dosage || '');
    setFrequency(med.frequency);
    setStartDate(new Date(med.startDate).toISOString().split('T')[0]);
    setReminderTime(med.reminderTime || '08:00');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      return toast.error('Medication name is required.');
    }

    const payload = {
      name,
      dosage,
      frequency,
      startDate: new Date(startDate),
      reminderTime
    };

    try {
      if (editingMed) {
        // Edit medication
        const res = await api.patch(`/medications/${editingMed._id}`, payload);
        if (res.data.success) {
          toast.success('Medication prescription updated!');
          fetchMedications();
        }
      } else {
        // Create medication
        const res = await api.post('/medications', payload);
        if (res.data.success) {
          toast.success('Medication successfully scheduled!');
          fetchMedications();
        }
      }
      setShowModal(false);
    } catch (err) {
      // Axios auto toast handles failures
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this medication?')) return;
    try {
      const res = await api.patch(`/medications/${id}`, { active: false });
      if (res.data.success) {
        toast.success('Medication marked inactive.');
        fetchMedications();
      }
    } catch (err) {
      console.error('Error deactivating medication:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medication permanently from logs?')) return;
    try {
      const res = await api.delete(`/medications/${id}`);
      if (res.data.success) {
        toast.success('Medication deleted successfully.');
        fetchMedications();
      }
    } catch (err) {
      console.error('Error deleting medication:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Medications</h1>
          <p className="text-sm text-gray-500 mt-1">Manage active prescriptions and customize reminder schedules.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Prescription
        </button>
      </div>

      {/* Grid of Medications */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-44 bg-white border border-gray-100 rounded-xl animate-shimmer"></div>
          <div className="h-44 bg-white border border-gray-100 rounded-xl animate-shimmer"></div>
          <div className="h-44 bg-white border border-gray-100 rounded-xl animate-shimmer"></div>
        </div>
      ) : medications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-150 p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm">
          <Pill className="h-10 w-10 text-teal-600 mb-3" />
          <h3 className="font-bold text-gray-800 text-base">No active prescriptions</h3>
          <p className="text-xs text-gray-500 mt-1 mb-6">Schedule your first medication dosage to get reminders and logs.</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm"
          >
            Add Prescription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map(med => (
            <MedicationCard
              key={med._id}
              medication={med}
              onEdit={openEditModal}
              onDeactivate={handleDeactivate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">
                {editingMed ? 'Edit Medication' : 'Add New Prescription'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-650 hover:bg-gray-100 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g. Metformin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Dosage</label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g. 500mg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value="daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Reminder Time</label>
                  <input
                    type="time"
                    required
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
                >
                  {editingMed ? 'Save Changes' : 'Schedule Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
