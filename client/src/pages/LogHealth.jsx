import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Activity, Heart, Thermometer, Gauge, ShieldAlert, Smile, AlignLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LogHealth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Vitals State
  const [glucose, setGlucose] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [weight, setWeight] = useState('');
  const [oxygenSat, setOxygenSat] = useState('');
  const [temperature, setTemperature] = useState('');

  // Symptoms List & State
  const availableSymptoms = [
    { id: 'headache', label: 'Headache' },
    { id: 'fatigue', label: 'Fatigue' },
    { id: 'nausea', label: 'Nausea' },
    { id: 'dizziness', label: 'Dizziness' },
    { id: 'chest_pain', label: 'Chest Pain' },
    { id: 'shortness_of_breath', label: 'Shortness of Breath' },
    { id: 'joint_pain', label: 'Joint Pain' }
  ];
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  // Mood State (1 to 10)
  const [moodScore, setMoodScore] = useState(5);

  // Notes State
  const [notes, setNotes] = useState('');

  const toggleSymptom = (symptomId) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(prev => prev.filter(s => s !== symptomId));
    } else {
      setSelectedSymptoms(prev => [...prev, symptomId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const logData = {
      vitals: {
        glucose: glucose ? Number(glucose) : undefined,
        bpSystolic: bpSystolic ? Number(bpSystolic) : undefined,
        bpDiastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
        heartRate: heartRate ? Number(heartRate) : undefined,
        weight: weight ? Number(weight) : undefined,
        oxygenSat: oxygenSat ? Number(oxygenSat) : undefined,
        temperature: temperature ? Number(temperature) : undefined
      },
      symptoms: selectedSymptoms,
      moodScore: Number(moodScore),
      notes: notes || undefined,
      source: 'manual'
    };

    try {
      const res = await api.post('/logs', logData);
      if (res.data.success) {
        toast.success('Daily health vitals logged successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      // Axios interceptor handles toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Log Daily Vitals</h1>
        <p className="text-sm text-gray-500 mt-1">Record your health status to track stats and share details with doctors.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Vitals Section */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
            <Activity className="h-5 w-5 text-teal-600" />
            Vitals (Optional)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Glucose */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Glucose (mg/dL)</label>
              <input
                type="number"
                value={glucose}
                onChange={(e) => setGlucose(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. 110"
              />
            </div>

            {/* BP Systolic */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. 120"
              />
            </div>

            {/* BP Diastolic */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. 80"
              />
            </div>

            {/* Heart Rate */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Heart Rate (bpm)</label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. 72"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. 75.4"
              />
            </div>

            {/* Oxygen Sat */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Oxygen Saturation (%)</label>
              <input
                type="number"
                value={oxygenSat}
                onChange={(e) => setOxygenSat(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. 98"
                min="0"
                max="100"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. 36.6"
              />
            </div>
          </div>
        </div>

        {/* 2. Symptoms Section */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
            <ShieldAlert className="h-5 w-5 text-teal-600" />
            Symptoms
          </h2>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {availableSymptoms.map((symptom) => {
              const selected = selectedSymptoms.includes(symptom.id);
              return (
                <button
                  type="button"
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selected
                      ? 'bg-teal-600 border-teal-650 text-white shadow-sm'
                      : 'bg-white border-gray-250 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                  {symptom.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Mood Section */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
            <Smile className="h-5 w-5 text-teal-600" />
            Mood Score
          </h2>

          <div className="pt-2">
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span className="flex items-center gap-1 text-gray-500">😫 Tired</span>
              <span className="text-teal-600 font-bold text-lg">{moodScore} / 10</span>
              <span className="flex items-center gap-1 text-gray-500">🤩 Star Face</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>
        </div>

        {/* 4. Notes Section */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
            <AlignLeft className="h-5 w-5 text-teal-600" />
            Notes & Observations
          </h2>

          <div>
            <textarea
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Record any comments, details on symptoms, or extra observations here..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-500 font-semibold text-sm rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting Log...' : 'Save Health Log'}
          </button>
        </div>

      </form>
    </div>
  );
}
