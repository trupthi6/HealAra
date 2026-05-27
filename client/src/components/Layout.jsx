import React, { useContext, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import MiddlePanel from './MiddlePanel';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Layout() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return <Outlet />;

  // Only show MiddlePanel on dashboard page for patients
  const showMiddlePanel = user.role === 'patient' && location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Topbar />

      <div
        className="flex"
        style={{ paddingTop: 56, height: '100vh' }}
      >
        {/* Left Sidebar — 200px, fixed */}
        <div
          className="hidden md:block shrink-0"
          style={{ width: 200 }}
        />

        {/* Middle panel — 240px, only on dashboard */}
        {showMiddlePanel && (
          <div
            className="hidden lg:block shrink-0 border-r border-slate-200 bg-white overflow-y-auto scrollbar-none"
            style={{ width: 240, height: 'calc(100vh - 56px)', position: 'sticky', top: 56 }}
          >
            <MiddlePanel />
          </div>
        )}

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto scrollbar-none pb-16 md:pb-0"
          style={{ height: 'calc(100vh - 56px)', background: '#F8FAFC' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
