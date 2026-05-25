import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
  Users, 
  Activity, 
  Pill, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Search, 
  Loader2, 
  Check, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Download,
  AlertCircle,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLogs: 0,
    activeMedications: 0,
    unresolvedAlerts: 0,
    newUsersThisWeek: 0,
    logsThisWeek: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Navigation tab: 'users' | 'logs' | 'medications' | 'alerts' | 'audit-logs'
  const [activeTab, setActiveTab] = useState('users');
  
  // Data grid states
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Bulk select states
  const [selectedIds, setSelectedIds] = useState([]);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null); // null = Create, object = Edit
  const [fieldErrors, setFieldErrors] = useState({}); // inline errors from API 422 response
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // User search dropdown (inside drawer)
  const [userQuery, setUserQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [loadingUsersSearch, setLoadingUsersSearch] = useState(false);
  const [selectedUserObj, setSelectedUserObj] = useState(null);

  // Drawer Form fields
  // Users form
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState('patient');
  const [uConditions, setUConditions] = useState([]);
  const [uConditionInput, setUConditionInput] = useState('');
  const [uGlucoseMax, setUGlucoseMax] = useState(180);
  const [uBpSystolicMax, setUBpSystolicMax] = useState(140);
  const [uHeartRateMax, setUHeartRateMax] = useState(100);

  // Health Logs form
  const [lLoggedAt, setLLoggedAt] = useState('');
  const [lGlucose, setLGlucose] = useState('');
  const [lBpSystolic, setLBpSystolic] = useState('');
  const [lBpDiastolic, setLBpDiastolic] = useState('');
  const [lHeartRate, setLHeartRate] = useState('');
  const [lWeight, setLWeight] = useState('');
  const [lOxygenSat, setLOxygenSat] = useState('');
  const [lTemperature, setLTemperature] = useState('');
  const [lSymptoms, setLSymptoms] = useState([]);
  const [lSymptomInput, setLSymptomInput] = useState('');
  const [lMoodScore, setLMoodScore] = useState(5);
  const [lNotes, setLNotes] = useState('');
  const [lSource, setLSource] = useState('manual');

  // Medications form
  const [mName, setMName] = useState('');
  const [mDosage, setMDosage] = useState('');
  const [mFrequency, setMFrequency] = useState('daily');
  const [mStartDate, setMStartDate] = useState('');
  const [mEndDate, setMEndDate] = useState('');
  const [mActive, setMActive] = useState(true);
  const [mReminderTime, setMReminderTime] = useState('08:00');

  // Alerts form
  const [aLogId, setALogId] = useState('');
  const [aType, setAType] = useState('glucose_high');
  const [aMessage, setAMessage] = useState('');
  const [aSeverity, setASeverity] = useState('warning');
  const [aResolved, setAResolved] = useState(false);

  // Debounce search effect (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch summary stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      toast.error('Failed to load summary stats.');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch active tab collections data
  const fetchTabData = async () => {
    try {
      setLoadingData(true);
      setSelectedIds([]);
      let url = `/admin/${activeTab}?page=${page}`;

      if (debouncedSearch) {
        if (activeTab === 'users') {
          url += `&search=${encodeURIComponent(debouncedSearch)}`;
        } else if (activeTab === 'logs' || activeTab === 'medications') {
          url += `&userId=${encodeURIComponent(debouncedSearch)}`;
        }
      }

      const res = await api.get(url);
      if (res.data.success) {
        if (activeTab === 'users') {
          setData(res.data.users || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalRecords(res.data.totalUsers || 0);
        } else if (activeTab === 'logs') {
          setData(res.data.logs || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalRecords(res.data.totalLogs || 0);
        } else if (activeTab === 'medications') {
          setData(res.data.medications || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalRecords(res.data.totalMedications || 0);
        } else if (activeTab === 'alerts') {
          setData(res.data.alerts || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalRecords(res.data.totalAlerts || 0);
        } else if (activeTab === 'audit-logs') {
          setData(res.data.auditLogs || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalRecords(res.data.totalAuditLogs || 0);
        }
      }
    } catch (err) {
      console.error(`Error loading ${activeTab} data:`, err);
      toast.error(`Error loading ${activeTab} data.`);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, page, debouncedSearch]);

  // Handle Search users in SlideDrawer (debounced)
  useEffect(() => {
    if (!userQuery) {
      setSearchedUsers([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        setLoadingUsersSearch(true);
        const res = await api.get(`/admin/users?search=${encodeURIComponent(userQuery)}`);
        if (res.data.success) {
          setSearchedUsers(res.data.users || []);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setLoadingUsersSearch(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [userQuery]);

  // Reset page when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch('');
    setDebouncedSearch('');
  };

  // Row selection helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map(item => item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Open confirm modal for deleting a single row
  const openConfirmDelete = (id) => {
    setIdToDelete(id);
    setConfirmModalOpen(true);
  };

  // Delete single row record
  const executeSingleDelete = async () => {
    try {
      const res = await api.delete(`/admin/${activeTab}/${idToDelete}`);
      if (res.data.success) {
        toast.success('Record deleted successfully.');
        setConfirmModalOpen(false);
        setIdToDelete(null);
        fetchTabData();
        fetchStats();
      }
    } catch (err) {
      console.error('Delete error:', err);
      const msg = err.response?.data?.message || 'Error deleting record.';
      toast.error(msg);
      setConfirmModalOpen(false);
    }
  };

  // Bulk delete selected records
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected items?`)) return;
    try {
      const res = await api.delete(`/admin/${activeTab}/bulk`, { data: { ids: selectedIds } });
      if (res.data.success) {
        toast.success(`${selectedIds.length} records deleted.`);
        setSelectedIds([]);
        fetchTabData();
        fetchStats();
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error(err.response?.data?.message || 'Error bulk deleting records.');
    }
  };

  // CSV Exporter (Client-side generation)
  const handleExportCSV = () => {
    if (data.length === 0) {
      toast.error('No records available to export.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    let headers = [];
    let rows = [];

    if (activeTab === 'users') {
      headers = ["ID", "Name", "Email", "Role", "Conditions", "Created At"];
      rows = data.map(r => [r._id, r.name, r.email, r.role, r.conditions?.join(';') || '', r.createdAt]);
    } else if (activeTab === 'logs') {
      headers = ["ID", "User ID", "User Name", "Logged At", "Glucose", "Systolic", "Diastolic", "Heart Rate", "Mood", "Source", "Symptoms", "Notes"];
      rows = data.map(r => [
        r._id, 
        r.userId?._id || r.userId || '', 
        r.userId?.name || '', 
        r.loggedAt, 
        r.vitals?.glucose || '', 
        r.vitals?.bpSystolic || '', 
        r.vitals?.bpDiastolic || '', 
        r.vitals?.heartRate || '', 
        r.moodScore || '', 
        r.source, 
        r.symptoms?.join(';') || '', 
        r.notes || ''
      ]);
    } else if (activeTab === 'medications') {
      headers = ["ID", "User ID", "User Name", "Name", "Dosage", "Frequency", "Active", "Start Date", "End Date", "Reminder"];
      rows = data.map(r => [
        r._id, 
        r.userId?._id || r.userId || '', 
        r.userId?.name || '', 
        r.name, 
        r.dosage || '', 
        r.frequency, 
        r.active, 
        r.startDate, 
        r.endDate || '', 
        r.reminderTime || ''
      ]);
    } else if (activeTab === 'alerts') {
      headers = ["ID", "User ID", "User Name", "Type", "Severity", "Message", "Resolved", "Created At"];
      rows = data.map(r => [
        r._id, 
        r.userId?._id || r.userId || '', 
        r.userId?.name || '', 
        r.type, 
        r.severity, 
        r.message, 
        r.resolved, 
        r.createdAt
      ]);
    } else if (activeTab === 'audit-logs') {
      headers = ["ID", "Admin ID", "Admin Name", "Action", "Collection", "Record ID", "Timestamp"];
      rows = data.map(r => [
        r._id, 
        r.adminId?._id || r.adminId || '', 
        r.adminId?.name || '', 
        r.action, 
        r.collectionName, 
        r.recordId, 
        r.timestamp
      ]);
    }

    // Combine headers and rows
    csvContent += [headers.join(","), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    // Download trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `${activeTab}-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Drawer Form (Create/Edit)
  const openDrawer = (record = null) => {
    setSelectedRecord(record);
    setFieldErrors({});
    setUserQuery('');
    setSearchedUsers([]);

    if (record) {
      // Edit pre-fills
      if (activeTab === 'users') {
        setUName(record.name || '');
        setUEmail(record.email || '');
        setURole(record.role || 'patient');
        setUConditions(record.conditions || []);
        setUGlucoseMax(record.thresholds?.glucoseMax || 180);
        setUBpSystolicMax(record.thresholds?.bpSystolicMax || 140);
        setUHeartRateMax(record.thresholds?.heartRateMax || 100);
      } else if (activeTab === 'logs') {
        setSelectedUserObj(record.userId || null);
        setLLoggedAt(record.loggedAt ? new Date(record.loggedAt).toISOString().slice(0, 16) : '');
        setLGlucose(record.vitals?.glucose || '');
        setLBpSystolic(record.vitals?.bpSystolic || '');
        setLBpDiastolic(record.vitals?.bpDiastolic || '');
        setLHeartRate(record.vitals?.heartRate || '');
        setLWeight(record.vitals?.weight || '');
        setLOxygenSat(record.vitals?.oxygenSat || '');
        setLTemperature(record.vitals?.temperature || '');
        setLSymptoms(record.symptoms || []);
        setLMoodScore(record.moodScore || 5);
        setLNotes(record.notes || '');
        setLSource(record.source || 'manual');
      } else if (activeTab === 'medications') {
        setSelectedUserObj(record.userId || null);
        setMName(record.name || '');
        setMDosage(record.dosage || '');
        setMFrequency(record.frequency || 'daily');
        setMStartDate(record.startDate ? new Date(record.startDate).toISOString().split('T')[0] : '');
        setMEndDate(record.endDate ? new Date(record.endDate).toISOString().split('T')[0] : '');
        setMActive(record.active !== undefined ? record.active : true);
        setMReminderTime(record.reminderTime || '08:00');
      } else if (activeTab === 'alerts') {
        setSelectedUserObj(record.userId || null);
        setALogId(record.logId || '');
        setAType(record.type || 'glucose_high');
        setAMessage(record.message || '');
        setASeverity(record.severity || 'warning');
        setAResolved(record.resolved !== undefined ? record.resolved : false);
      }
    } else {
      // Create resets
      setSelectedUserObj(null);
      setUName('');
      setUEmail('');
      setUPassword('');
      setURole('patient');
      setUConditions([]);
      setUGlucoseMax(180);
      setUBpSystolicMax(140);
      setUHeartRateMax(100);

      setLLoggedAt(new Date().toISOString().slice(0, 16));
      setLGlucose('');
      setLBpSystolic('');
      setLBpDiastolic('');
      setLHeartRate('');
      setLWeight('');
      setLOxygenSat('');
      setLTemperature('');
      setLSymptoms([]);
      setLMoodScore(5);
      setLNotes('');
      setLSource('manual');

      setMName('');
      setMDosage('');
      setMFrequency('daily');
      setMStartDate(new Date().toISOString().split('T')[0]);
      setMEndDate('');
      setMActive(true);
      setMReminderTime('08:00');

      setALogId('');
      setAType('glucose_high');
      setAMessage('');
      setASeverity('warning');
      setAResolved(false);
    }

    setDrawerOpen(true);
  };

  // Submit Drawer Form
  const handleDrawerSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    let payload = {};
    if (activeTab === 'users') {
      payload = {
        name: uName,
        email: uEmail,
        role: uRole,
        conditions: uConditions,
        thresholds: {
          glucoseMax: Number(uGlucoseMax),
          bpSystolicMax: Number(uBpSystolicMax),
          heartRateMax: Number(uHeartRateMax)
        }
      };
      if (!selectedRecord) {
        payload.password = uPassword;
      }
    } else if (activeTab === 'logs') {
      if (!selectedUserObj) {
        setFieldErrors({ userId: 'User selection is required.' });
        setSubmitting(false);
        return;
      }
      payload = {
        userId: selectedUserObj._id || selectedUserObj,
        loggedAt: lLoggedAt ? new Date(lLoggedAt) : undefined,
        vitals: {
          glucose: lGlucose ? Number(lGlucose) : undefined,
          bpSystolic: lBpSystolic ? Number(lBpSystolic) : undefined,
          bpDiastolic: lBpDiastolic ? Number(lBpDiastolic) : undefined,
          heartRate: lHeartRate ? Number(lHeartRate) : undefined,
          weight: lWeight ? Number(lWeight) : undefined,
          oxygenSat: lOxygenSat ? Number(lOxygenSat) : undefined,
          temperature: lTemperature ? Number(lTemperature) : undefined
        },
        symptoms: lSymptoms,
        moodScore: Number(lMoodScore),
        notes: lNotes,
        source: lSource
      };
    } else if (activeTab === 'medications') {
      if (!selectedUserObj) {
        setFieldErrors({ userId: 'User selection is required.' });
        setSubmitting(false);
        return;
      }
      payload = {
        userId: selectedUserObj._id || selectedUserObj,
        name: mName,
        dosage: mDosage,
        frequency: mFrequency,
        startDate: mStartDate ? new Date(mStartDate) : undefined,
        endDate: mEndDate ? new Date(mEndDate) : undefined,
        active: mActive,
        reminderTime: mReminderTime
      };
    } else if (activeTab === 'alerts') {
      if (!selectedUserObj) {
        setFieldErrors({ userId: 'User selection is required.' });
        setSubmitting(false);
        return;
      }
      payload = {
        userId: selectedUserObj._id || selectedUserObj,
        logId: aLogId || undefined,
        type: aType,
        message: aMessage,
        severity: aSeverity,
        resolved: aResolved
      };
    }

    try {
      let res;
      if (selectedRecord) {
        res = await api.patch(`/admin/${activeTab}/${selectedRecord._id}`, payload);
      } else {
        res = await api.post(`/admin/${activeTab}`, payload);
      }

      if (res.data.success) {
        toast.success(`Record ${selectedRecord ? 'updated' : 'created'} successfully.`);
        setDrawerOpen(false);
        fetchTabData();
        fetchStats();
      }
    } catch (err) {
      console.error('Form submission error:', err);
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        if (Array.isArray(errors)) {
          const mappedErrors = {};
          errors.forEach(e => {
            mappedErrors[e.field] = e.message;
          });
          setFieldErrors(mappedErrors);
          toast.error('Validation failed. Please correct form fields.');
        } else {
          toast.error('Validation failed.');
        }
      } else {
        toast.error(err.response?.data?.message || 'Server error saving record.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Conditions tag list modifiers
  const handleConditionKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = uConditionInput.trim().toLowerCase();
      if (val && !uConditions.includes(val)) {
        setUConditions([...uConditions, val]);
      }
      setUConditionInput('');
    }
  };

  const removeConditionTag = (tag) => {
    setUConditions(uConditions.filter(t => t !== tag));
  };

  // Symptoms tag list modifiers
  const handleSymptomKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = lSymptomInput.trim().toLowerCase();
      if (val && !lSymptoms.includes(val)) {
        setLSymptoms([...lSymptoms, val]);
      }
      setLSymptomInput('');
    }
  };

  const removeSymptomTag = (tag) => {
    setLSymptoms(lSymptoms.filter(t => t !== tag));
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-teal-600" /> Admin Control Center
          </h1>
          <p className="text-xs text-gray-500 mt-1">Full database oversight and secure audit logging</p>
        </div>
      </div>

      {/* 2. Stats Bar Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Users */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          {loadingStats ? (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer"></div>
          ) : null}
          <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shrink-0">
            <Users className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Users</span>
            <span className="text-xl font-bold text-gray-900 mt-0.5 block">{stats.totalUsers}</span>
          </div>
        </div>

        {/* Card 2: Logs */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          {loadingStats ? (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer"></div>
          ) : null}
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Activity className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Logs</span>
            <span className="text-xl font-bold text-gray-900 mt-0.5 block">{stats.totalLogs}</span>
          </div>
        </div>

        {/* Card 3: Medications */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          {loadingStats ? (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer"></div>
          ) : null}
          <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0">
            <Pill className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Meds</span>
            <span className="text-xl font-bold text-gray-900 mt-0.5 block">{stats.activeMedications}</span>
          </div>
        </div>

        {/* Card 4: Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          {loadingStats ? (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer"></div>
          ) : null}
          <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Alerts</span>
            <span className="text-xl font-bold text-red-650 mt-0.5 block">{stats.unresolvedAlerts}</span>
          </div>
        </div>

        {/* Card 5: New Users Growth */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          {loadingStats ? (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer"></div>
          ) : null}
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
            stats.newUsersThisWeek > 0 ? 'bg-emerald-50 text-emerald-650' : 'bg-gray-50 text-gray-400'
          }`}>
            <ArrowUpRight className="h-5.5 w-5.5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Users (7d)</span>
            <span className={`text-xl font-bold mt-0.5 block ${stats.newUsersThisWeek > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
              {stats.newUsersThisWeek > 0 ? `+${stats.newUsersThisWeek}` : stats.newUsersThisWeek}
            </span>
          </div>
        </div>

        {/* Card 6: Health Logs Growth */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          {loadingStats ? (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer"></div>
          ) : null}
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
            stats.logsThisWeek > 0 ? 'bg-emerald-50 text-emerald-650' : 'bg-gray-50 text-gray-400'
          }`}>
            <ArrowUpRight className="h-5.5 w-5.5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Logs (7d)</span>
            <span className={`text-xl font-bold mt-0.5 block ${stats.logsThisWeek > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
              {stats.logsThisWeek > 0 ? `+${stats.logsThisWeek}` : stats.logsThisWeek}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Left Tab Switcher and Controls */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border-b border-gray-250 pb-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 border border-gray-200 rounded-xl max-w-max">
          {[
            { id: 'users', name: 'Users' },
            { id: 'logs', name: 'Health Logs' },
            { id: 'medications', name: 'Medications' },
            { id: 'alerts', name: 'Alerts' },
            { id: 'audit-logs', name: 'Audit Log' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-teal-600 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Global actions: CSV Export, Bulk Delete, Add Record, Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Debounced Search Input */}
          {activeTab !== 'audit-logs' && (
            <div className="relative">
              <Search className="absolute inset-y-0 left-3 my-auto h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === 'users'
                    ? "Search name or email..."
                    : "Search by User ObjectId..."
                }
                className="w-full md:w-60 pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          )}

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 bg-white rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-xs"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>

          {/* Bulk Delete button (Appears only when items are checked) */}
          {selectedIds.length > 0 && activeTab !== 'audit-logs' && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Trash2 className="h-4 w-4" /> Delete Selected ({selectedIds.length})
            </button>
          )}

          {/* Add Record Button (Hidden for Audit Logs Tab) */}
          {activeTab !== 'audit-logs' && (
            <button
              onClick={() => openDrawer(null)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="h-4.5 w-4.5" /> Add Record
            </button>
          )}
        </div>
      </div>

      {/* 4. DataTable Grid Component */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {loadingData ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Retrieving records from Atlas...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 text-center text-gray-400">
            <AlertCircle className="h-10 w-10 text-gray-300" />
            <div>
              <p className="font-bold text-sm text-gray-600">No records found</p>
              <p className="text-xs mt-1">There are no entries matches the filter constraints in MongoDB.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 border-b font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  {activeTab !== 'audit-logs' && (
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === data.length && data.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-teal-650 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                      />
                    </th>
                  )}
                  {/* Headers per Tab */}
                  {activeTab === 'users' && (
                    <>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Conditions</th>
                      <th className="p-4">Created At</th>
                    </>
                  )}
                  {activeTab === 'logs' && (
                    <>
                      <th className="p-4">User</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Glucose</th>
                      <th className="p-4">BP (Sys/Dia)</th>
                      <th className="p-4">Heart Rate</th>
                      <th className="p-4">Mood</th>
                      <th className="p-4">Source</th>
                    </>
                  )}
                  {activeTab === 'medications' && (
                    <>
                      <th className="p-4">User</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Dosage</th>
                      <th className="p-4">Frequency</th>
                      <th className="p-4">Active</th>
                      <th className="p-4">Start Date</th>
                    </>
                  )}
                  {activeTab === 'alerts' && (
                    <>
                      <th className="p-4">User</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Severity</th>
                      <th className="p-4">Message</th>
                      <th className="p-4">Resolved</th>
                      <th className="p-4">Date</th>
                    </>
                  )}
                  {activeTab === 'audit-logs' && (
                    <>
                      <th className="p-4">Admin</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Collection</th>
                      <th className="p-4">Record ID</th>
                      <th className="p-4">Timestamp</th>
                    </>
                  )}
                  {activeTab !== 'audit-logs' && <th className="p-4 text-center w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700 font-medium">
                {data.map(row => (
                  <tr key={row._id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(row._id) ? 'bg-teal-50/20' : ''}`}>
                    {activeTab !== 'audit-logs' && (
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row._id)}
                          onChange={() => handleSelectRow(row._id)}
                          className="h-4 w-4 text-teal-650 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                    )}
                    
                    {/* Columns per tab */}
                    {activeTab === 'users' && (
                      <>
                        <td className="p-4 font-bold text-gray-900">{row.name}</td>
                        <td className="p-4">{row.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                            row.role === 'admin'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : row.role === 'doctor'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-teal-50 text-teal-700 border-teal-200'
                          }`}>
                            {row.role}
                          </span>
                        </td>
                        <td className="p-4 capitalize truncate max-w-xs">{row.conditions?.join(', ') || 'None'}</td>
                        <td className="p-4">{new Date(row.createdAt).toLocaleDateString()}</td>
                      </>
                    )}

                    {activeTab === 'logs' && (
                      <>
                        <td className="p-4">
                          <span className="font-bold text-gray-900 block">{row.userId?.name || 'Unknown'}</span>
                          <span className="text-[9px] text-gray-400 font-semibold block uppercase truncate max-w-[120px]">{row.userId?._id || row.userId}</span>
                        </td>
                        <td className="p-4">{new Date(row.loggedAt).toLocaleString()}</td>
                        <td className="p-4 font-bold text-gray-800">{row.vitals?.glucose ? `${row.vitals.glucose} mg/dL` : '-'}</td>
                        <td className="p-4 font-bold text-gray-800">
                          {row.vitals?.bpSystolic && row.vitals?.bpDiastolic ? `${row.vitals.bpSystolic}/${row.vitals.bpDiastolic} mmHg` : '-'}
                        </td>
                        <td className="p-4 font-bold text-gray-800">{row.vitals?.heartRate ? `${row.vitals.heartRate} bpm` : '-'}</td>
                        <td className="p-4 font-bold text-gray-800">{row.moodScore ? `${row.moodScore}/10` : '-'}</td>
                        <td className="p-4 capitalize">{row.source}</td>
                      </>
                    )}

                    {activeTab === 'medications' && (
                      <>
                        <td className="p-4">
                          <span className="font-bold text-gray-900 block">{row.userId?.name || 'Unknown'}</span>
                          <span className="text-[9px] text-gray-400 font-semibold block uppercase truncate max-w-[120px]">{row.userId?._id || row.userId}</span>
                        </td>
                        <td className="p-4 font-bold text-teal-650">{row.name}</td>
                        <td className="p-4">{row.dosage || '-'}</td>
                        <td className="p-4 capitalize">{row.frequency?.replace('_', ' ')}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.active
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-100 text-gray-500 border-gray-250'
                          }`}>
                            {row.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">{new Date(row.startDate).toLocaleDateString()}</td>
                      </>
                    )}

                    {activeTab === 'alerts' && (
                      <>
                        <td className="p-4">
                          <span className="font-bold text-gray-900 block">{row.userId?.name || 'Unknown'}</span>
                          <span className="text-[9px] text-gray-400 font-semibold block uppercase truncate max-w-[120px]">{row.userId?._id || row.userId}</span>
                        </td>
                        <td className="p-4 font-bold capitalize text-red-650">{row.type?.replace('_', ' ')}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                            row.severity === 'critical'
                              ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                              : 'bg-amber-50 text-amber-700 border-amber-250'
                          }`}>
                            {row.severity}
                          </span>
                        </td>
                        <td className="p-4 truncate max-w-[180px]">{row.message}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.resolved
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-55 text-red-700 border-red-200'
                          }`}>
                            {row.resolved ? 'Resolved' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4">{new Date(row.createdAt).toLocaleDateString()}</td>
                      </>
                    )}

                    {activeTab === 'audit-logs' && (
                      <>
                        <td className="p-4">
                          <span className="font-bold text-gray-900 block">{row.adminId?.name || 'Admin'}</span>
                          <span className="text-[9px] text-gray-400 font-semibold block uppercase">{row.adminId?._id || row.adminId || '-'}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            row.action === 'CREATE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : row.action === 'UPDATE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {row.action}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-gray-700">{row.collectionName}</td>
                        <td className="p-4 font-mono text-[10px] text-gray-500 uppercase">{row.recordId || '-'}</td>
                        <td className="p-4 text-gray-550 font-semibold">{new Date(row.timestamp).toLocaleString()}</td>
                      </>
                    )}

                    {/* Actions Column (Hidden for Audit Logs) */}
                    {activeTab !== 'audit-logs' && (
                      <td className="p-4 text-center flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => openDrawer(row)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => openConfirmDelete(row._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loadingData && totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center text-xs font-semibold text-gray-500">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span>Page {page} of {totalPages} ({totalRecords} records)</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* 5. Slide-out Right Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          {/* Backdrop close area */}
          <div className="flex-1" onClick={() => setDrawerOpen(false)}></div>

          {/* Drawer content panel */}
          <div className="w-full max-w-md bg-white h-screen shadow-2xl flex flex-col z-50 transform transition-transform duration-300 translate-x-0">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-gray-150 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">
                {selectedRecord ? `Edit ${activeTab.slice(0, -1)}` : `Create ${activeTab.slice(0, -1)}`}
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-650 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleDrawerSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Dropdown User Search: Required for Health Logs, Medications, Alerts */}
              {activeTab !== 'users' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Select Patient <span className="text-red-500">*</span>
                  </label>
                  
                  {selectedUserObj ? (
                    <div className="flex items-center justify-between p-3 border border-teal-150 bg-teal-50/20 rounded-lg">
                      <div>
                        <span className="font-bold text-sm text-gray-900 block">{selectedUserObj.name || selectedUserObj}</span>
                        <span className="text-[10px] font-semibold text-gray-400 block uppercase font-mono">{selectedUserObj._id || selectedUserObj}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUserObj(null)}
                        className="text-gray-450 hover:text-red-650 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder="Search patient by name..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                      
                      {loadingUsersSearch && (
                        <div className="absolute right-3 top-2.5">
                          <Loader2 className="h-4 w-4 text-teal-600 animate-spin" />
                        </div>
                      )}

                      {searchedUsers.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-xl z-50 divide-y">
                          {searchedUsers.map(usr => (
                            <button
                              key={usr._id}
                              type="button"
                              onClick={() => {
                                setSelectedUserObj(usr);
                                setUserQuery('');
                                setSearchedUsers([]);
                              }}
                              className="w-full text-left p-3 hover:bg-teal-50/30 text-xs transition-colors flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-gray-900 block">{usr.name}</span>
                                <span className="text-[9px] text-gray-500 block">{usr.email}</span>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase font-bold">{usr.role}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {fieldErrors.userId && (
                    <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.userId}</span>
                  )}
                </div>
              )}

              {/* TABS - USERS FORM FIELDS */}
              {activeTab === 'users' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={uName}
                      onChange={(e) => setUName(e.target.value)}
                      placeholder="Rahul Verma"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    />
                    {fieldErrors.name && (
                      <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.name}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={uEmail}
                      onChange={(e) => setUEmail(e.target.value)}
                      placeholder="rahul@healara.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    />
                    {fieldErrors.email && (
                      <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.email}</span>
                    )}
                  </div>

                  {!selectedRecord && (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Password</label>
                      <input
                        type="text"
                        required
                        value={uPassword}
                        onChange={(e) => setUPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                      />
                      {fieldErrors.password && (
                        <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.password}</span>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Role</label>
                    <select
                      value={uRole}
                      onChange={(e) => setURole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option value="patient">patient</option>
                      <option value="doctor">doctor</option>
                      <option value="admin">admin</option>
                    </select>
                    {fieldErrors.role && (
                      <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.role}</span>
                    )}
                  </div>

                  {uRole === 'patient' && (
                    <div className="space-y-4 pt-3 border-t border-gray-250">
                      {/* Conditions Tags list */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Conditions (Press Enter)</label>
                        <input
                          type="text"
                          value={uConditionInput}
                          onChange={(e) => setUConditionInput(e.target.value)}
                          onKeyDown={handleConditionKeyPress}
                          placeholder="e.g. diabetes, press Enter"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                          {uConditions.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-150 capitalize">
                              {tag}
                              <X className="h-3 w-3 cursor-pointer text-teal-500 hover:text-teal-700" onClick={() => removeConditionTag(tag)} />
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Threshold values */}
                      <div>
                        <label className="block text-xs font-bold text-teal-650 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Settings className="h-4.5 w-4.5" /> Threshold Limits
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold uppercase">Glucose Max</label>
                            <input
                              type="number"
                              value={uGlucoseMax}
                              onChange={(e) => setUGlucoseMax(e.target.value)}
                              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold uppercase">BP Systolic</label>
                            <input
                              type="number"
                              value={uBpSystolicMax}
                              onChange={(e) => setUBpSystolicMax(e.target.value)}
                              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold uppercase">HR Max</label>
                            <input
                              type="number"
                              value={uHeartRateMax}
                              onChange={(e) => setUHeartRateMax(e.target.value)}
                              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TABS - HEALTH LOGS FORM FIELDS */}
              {activeTab === 'logs' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Logged At</label>
                    <input
                      type="datetime-local"
                      value={lLoggedAt}
                      onChange={(e) => setLLoggedAt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                    {fieldErrors.loggedAt && (
                      <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.loggedAt}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Glucose (mg/dL)</label>
                      <input
                        type="number"
                        value={lGlucose}
                        onChange={(e) => setLGlucose(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Heart Rate (bpm)</label>
                      <input
                        type="number"
                        value={lHeartRate}
                        onChange={(e) => setLHeartRate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">BP Systolic</label>
                      <input
                        type="number"
                        value={lBpSystolic}
                        onChange={(e) => setLBpSystolic(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">BP Diastolic</label>
                      <input
                        type="number"
                        value={lBpDiastolic}
                        onChange={(e) => setLBpDiastolic(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-405 font-bold uppercase">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={lWeight}
                        onChange={(e) => setLWeight(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-405 font-bold uppercase">O2 Sat (%)</label>
                      <input
                        type="number"
                        value={lOxygenSat}
                        onChange={(e) => setLOxygenSat(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-405 font-bold uppercase">Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={lTemperature}
                        onChange={(e) => setLTemperature(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Symptoms (Press Enter)</label>
                    <input
                      type="text"
                      value={lSymptomInput}
                      onChange={(e) => setLSymptomInput(e.target.value)}
                      onKeyDown={handleSymptomKeyPress}
                      placeholder="e.g. fatigue, press Enter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lSymptoms.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-150 capitalize">
                          {tag}
                          <X className="h-3 w-3 cursor-pointer text-teal-500 hover:text-teal-700" onClick={() => removeSymptomTag(tag)} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Mood Score (1-10): <span className="text-teal-600 font-bold">{lMoodScore}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={lMoodScore}
                      onChange={(e) => setLMoodScore(e.target.value)}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Notes</label>
                    <textarea
                      value={lNotes}
                      onChange={(e) => setLNotes(e.target.value)}
                      rows="2"
                      placeholder="Add case logs notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Source</label>
                    <select
                      value={lSource}
                      onChange={(e) => setLSource(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option value="manual">Manual</option>
                      <option value="wearable">Wearable</option>
                    </select>
                  </div>
                </>
              )}

              {/* TABS - MEDICATIONS FORM FIELDS */}
              {activeTab === 'medications' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Medication Name</label>
                    <input
                      type="text"
                      required
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                      placeholder="Metformin"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    />
                    {fieldErrors.name && (
                      <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.name}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Dosage</label>
                    <input
                      type="text"
                      value={mDosage}
                      onChange={(e) => setMDosage(e.target.value)}
                      placeholder="500mg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Frequency</label>
                    <select
                      value={mFrequency}
                      onChange={(e) => setMFrequency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option value="daily">daily</option>
                      <option value="twice_daily">twice_daily</option>
                      <option value="weekly">weekly</option>
                      <option value="as_needed">as_needed</option>
                    </select>
                    {fieldErrors.frequency && (
                      <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.frequency}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={mStartDate}
                        onChange={(e) => setMStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">End Date (Optional)</label>
                      <input
                        type="date"
                        value={mEndDate}
                        onChange={(e) => setMEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Reminder Time</label>
                    <input
                      type="time"
                      value={mReminderTime}
                      onChange={(e) => setMReminderTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="medActive"
                      checked={mActive}
                      onChange={(e) => setMActive(e.target.checked)}
                      className="h-4 w-4 text-teal-655 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                    />
                    <label htmlFor="medActive" className="text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer select-none">
                      Active Schedule
                    </label>
                  </div>
                </>
              )}

              {/* TABS - ALERTS FORM FIELDS */}
              {activeTab === 'alerts' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Log ID (Optional)</label>
                    <input
                      type="text"
                      value={aLogId}
                      onChange={(e) => setALogId(e.target.value)}
                      placeholder="Health log Object ID references"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Alert Type</label>
                    <select
                      value={aType}
                      onChange={(e) => setAType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option value="glucose_high">glucose_high</option>
                      <option value="bp_high">bp_high</option>
                      <option value="heart_rate_high">heart_rate_high</option>
                      <option value="medication_missed">medication_missed</option>
                    </select>
                    {fieldErrors.type && (
                      <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.type}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Alert Message</label>
                    <textarea
                      required
                      value={aMessage}
                      onChange={(e) => setAMessage(e.target.value)}
                      rows="3"
                      placeholder="Explain vital spikes or medication omissions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Severity</label>
                    <select
                      value={aSeverity}
                      onChange={(e) => setASeverity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option value="warning">warning</option>
                      <option value="critical">critical</option>
                    </select>
                    {fieldErrors.severity && (
                      <span className="text-red-500 text-[11px] font-semibold mt-1 block">{fieldErrors.severity}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="alertResolved"
                      checked={aResolved}
                      onChange={(e) => setAResolved(e.target.checked)}
                      className="h-4 w-4 text-teal-655 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                    />
                    <label htmlFor="alertResolved" className="text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer select-none">
                      Resolved
                    </label>
                  </div>
                </>
              )}

              {/* Drawer Action buttons */}
              <div className="pt-6 flex gap-3 border-t border-gray-100 mt-8">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-350 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {selectedRecord ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Confirm Modal for single row deletes */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Confirm Delete</h4>
            <p className="text-xs text-gray-500 leading-normal">
              Are you sure you want to delete this {activeTab.slice(0, -1)} record? This will permanently erase the data from Atlas.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-colors"
              >
                No, Keep
              </button>
              <button
                onClick={executeSingleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
