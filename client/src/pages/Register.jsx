import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import BrandLogo from '../components/BrandLogo';
import {
  Activity,
  Mail,
  Lock,
  User,
  Calendar,
  Heart,
  Shield,
  Settings,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const CONDITIONS = ['diabetes', 'hypertension', 'asthma', 'heart disease', 'obesity', 'thyroid'];

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // Step 1: Basic info, Step 2: Patient-specific
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');

  // Patient specific fields
  const [dob, setDob] = useState('');
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [glucoseMax, setGlucoseMax] = useState(180);
  const [bpSystolicMax, setBpSystolicMax] = useState(140);
  const [heartRateMax, setHeartRateMax] = useState(100);

  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(false);

  // Fetch doctors list for selection
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setFetchingDoctors(true);
        const res = await api.get('/auth/doctors');
        if (res.data.success) {
          setDoctors(res.data.doctors || []);
        }
      } catch (err) {
        console.error('Error fetching doctors list:', err);
      } finally {
        setFetchingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleConditionToggle = (condition) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  };

  const handleDoctorToggle = (docId) => {
    setSelectedDoctors((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const validateStep1 = () => {
    if (!name.trim()) { toast.error('Full name is required.'); return false; }
    if (!email.trim()) { toast.error('Email address is required.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Please enter a valid email address.'); return false; }
    if (!password || password.length < 6) { toast.error('Password must be at least 6 characters.'); return false; }
    return true;
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    if (role === 'patient') {
      setStep(2);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateStep1()) return;

    if (role === 'patient' && !dob) {
      toast.error('Date of birth is required for patients.');
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    };

    if (role === 'patient') {
      payload.dob = dob;
      payload.conditions = selectedConditions;
      payload.sharedWithDoctors = selectedDoctors;
      payload.thresholds = {
        glucoseMax: Number(glucoseMax),
        bpSystolicMax: Number(bpSystolicMax),
        heartRateMax: Number(heartRateMax),
      };
    }

    setLoading(true);
    try {
      await register(payload);
      toast.success('Registration successful! Welcome to HealAra.');
      if (role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      // Show error from server if the interceptor didn't already
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-50 flex items-center justify-center py-12 px-4">

      <div className="w-full max-w-lg">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center -mt-8 -mb-4">
            <BrandLogo style={{ transform: 'scale(0.65)', transformOrigin: 'center' }} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Join HealAra to start monitoring your health
          </p>
        </div>

        {/* Step Indicator (patient only) */}
        {role === 'patient' && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${step >= 1 ? 'text-teal-600' : 'text-gray-400'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              Basic Info
            </div>
            <div className={`h-px w-12 transition-colors ${step >= 2 ? 'bg-teal-400' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${step >= 2 ? 'text-teal-600' : 'text-gray-400'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                2
              </div>
              Health Profile
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <div className="p-8 space-y-5">

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  I am registering as a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`py-4 px-4 border-2 rounded-xl flex flex-col items-center gap-2 text-sm font-semibold transition-all ${
                      role === 'patient'
                        ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <UserPlus className={`h-6 w-6 ${role === 'patient' ? 'text-teal-600' : 'text-gray-400'}`} />
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`py-4 px-4 border-2 rounded-xl flex flex-col items-center gap-2 text-sm font-semibold transition-all ${
                      role === 'doctor'
                        ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Stethoscope className={`h-6 w-6 ${role === 'doctor' ? 'text-teal-600' : 'text-gray-400'}`} />
                    Healthcare Provider
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50"
                    placeholder="Rahul Verma"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50"
                    placeholder="rahul@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              {/* Submit / Next */}
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Creating Account…'
                ) : role === 'patient' ? (
                  <>Next: Health Profile <ArrowRight className="h-4 w-4" /></>
                ) : (
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 2: Patient Health Profile ── */}
          {step === 2 && role === 'patient' && (
            <div className="p-8 space-y-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                ← Back to Basic Info
              </button>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dob" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="dob"
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50"
                  />
                </div>
              </div>

              {/* Chronic Conditions */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Chronic Conditions <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => {
                    const active = selectedConditions.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleConditionToggle(c)}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-semibold capitalize transition-all ${
                          active
                            ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-teal-50'
                        }`}
                      >
                        {active && '✓ '}{c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Doctor Selection — CRITICAL SECTION */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Assign to Doctor(s) <span className="text-gray-400 font-normal">(optional — doctors you select can view your health data)</span>
                </label>

                {fetchingDoctors ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center text-xs text-gray-400">
                    Loading available doctors…
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
                    <Stethoscope className="h-6 w-6 text-amber-400 mx-auto mb-1" />
                    <p className="text-xs text-amber-700 font-medium">No doctors registered yet.</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">You can assign a doctor later from your Settings page.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {doctors.map((doc) => {
                      const selected = selectedDoctors.includes(doc._id);
                      return (
                        <label
                          key={doc._id}
                          className={`flex items-center gap-3 p-3.5 cursor-pointer hover:bg-teal-50 transition-colors ${selected ? 'bg-teal-50' : ''}`}
                        >
                          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selected ? 'bg-teal-600 border-teal-600' : 'border-gray-300 bg-white'
                          }`} onClick={() => handleDoctorToggle(doc._id)}>
                            {selected && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="h-7 w-7 bg-teal-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {doc.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{doc.name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{doc.email}</p>
                            </div>
                          </div>
                          {selected && (
                            <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                              Selected
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {selectedDoctors.length > 0 && (
                  <p className="text-[11px] text-teal-600 font-medium mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {selectedDoctors.length} doctor{selectedDoctors.length > 1 ? 's' : ''} selected — they will be able to view your health logs and AI reports.
                  </p>
                )}
              </div>

              {/* Alert Thresholds */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-teal-500" />
                  Alert Threshold Limits
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Glucose (mg/dL)', value: glucoseMax, onChange: setGlucoseMax },
                    { label: 'BP Systolic', value: bpSystolicMax, onChange: setBpSystolicMax },
                    { label: 'Heart Rate (bpm)', value: heartRateMax, onChange: setHeartRateMax },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">{field.label}</label>
                      <input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account…' : (
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 px-8 py-5 bg-gray-50 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
