import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogHealth from './pages/LogHealth';
import Trends from './pages/Trends';
import Medications from './pages/Medications';
import Alerts from './pages/Alerts';
import DoctorPortal from './pages/DoctorPortal';
import AdminPanel from './pages/AdminPanel';
import AIAdvisor from './pages/AIAdvisor';
import Settings from './pages/Settings';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Private Route Guard (Requires Authentication)
function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Role Guard (Restricts access to matching user roles)
function RoleGuard({ children, allowedRoles, fallbackPath }) {
  const { user } = useContext(AuthContext);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

// Root Route Router Selector
function RootSelector() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  if (user.role === 'doctor') {
    return <Navigate to="/doctor" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Core System Dashboard Layout */}
          <Route path="/" element={<Layout />}>
            {/* Root Selection Selector */}
            <Route index element={<RootSelector />} />

            {/* Patient Workspace Pages */}
            <Route
              path="dashboard"
              element={
                <PrivateRoute>
                  <RoleGuard allowedRoles={['patient']} fallbackPath="/doctor">
                    <Dashboard />
                  </RoleGuard>
                </PrivateRoute>
              }
            />
            <Route
              path="log"
              element={
                <PrivateRoute>
                  <RoleGuard allowedRoles={['patient']} fallbackPath="/doctor">
                    <LogHealth />
                  </RoleGuard>
                </PrivateRoute>
              }
            />
            <Route
              path="trends"
              element={
                <PrivateRoute>
                  <RoleGuard allowedRoles={['patient']} fallbackPath="/doctor">
                    <Trends />
                  </RoleGuard>
                </PrivateRoute>
              }
            />
            <Route
              path="medications"
              element={
                <PrivateRoute>
                  <RoleGuard allowedRoles={['patient']} fallbackPath="/doctor">
                    <Medications />
                  </RoleGuard>
                </PrivateRoute>
              }
            />
            <Route
              path="alerts"
              element={
                <PrivateRoute>
                  <RoleGuard allowedRoles={['patient']} fallbackPath="/doctor">
                    <Alerts />
                  </RoleGuard>
                </PrivateRoute>
              }
            />
            <Route
              path="advisor"
              element={
                <PrivateRoute>
                  <RoleGuard allowedRoles={['patient']} fallbackPath="/doctor">
                    <AIAdvisor />
                  </RoleGuard>
                </PrivateRoute>
              }
            />
            <Route
              path="settings"
              element={
                <PrivateRoute>
                  <RoleGuard allowedRoles={['patient']} fallbackPath="/doctor">
                    <Settings />
                  </RoleGuard>
                </PrivateRoute>
              }
            />

            {/* Doctor Workspace Pages */}
            <Route
              path="doctor"
              element={
                <PrivateRoute>
                  <RoleGuard allowedRoles={['doctor']} fallbackPath="/dashboard">
                    <DoctorPortal />
                  </RoleGuard>
                </PrivateRoute>
              }
            />

            {/* Admin Workspace Pages */}
            <Route
              path="admin"
              element={
                <PrivateRoute>
                  <RoleGuard allowedRoles={['admin']} fallbackPath="/">
                    <AdminPanel />
                  </RoleGuard>
                </PrivateRoute>
              }
            />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
