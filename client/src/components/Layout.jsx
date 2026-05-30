import React, { useState, useContext, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MiddlePanel from './MiddlePanel';
import { AuthContext } from '../context/AuthContext';
import useNotifications from '../hooks/useNotifications';
import BrandLogo from './BrandLogo';
import { Bell, Check, CircleDot } from 'lucide-react';

export default function Layout() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { notifications, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Close notifications dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return <Outlet />;

  // Only show MiddlePanel on dashboard page for patients
  const showMiddlePanel = user.role === 'patient' && location.pathname === '/dashboard';

  return (
    <div className="h-screen w-full bg-gray-50/50 flex overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-[260px] min-w-0 h-screen overflow-hidden pb-16 md:pb-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 xl:px-12 z-10 shrink-0">
          <div className="flex items-center">
            {/* Show logo on mobile since sidebar is hidden */}
            <div className="md:hidden mr-3 -ml-2">
              {/* Simple H Logo badge for mobile */}
              <div className="h-9 w-9 rounded-full bg-[#0F6E56] flex items-center justify-center text-white font-bold text-[15px]">
                H
              </div>
            </div>
            <h2 className="text-[18px] font-semibold text-gray-800">
              Welcome back, <span className="text-teal-600">{user.name.split(' ')[0]}</span>
            </h2>
          </div>

          {/* Notifications Panel Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-50 rounded-full transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-2 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Unread Alerts</span>
                  <span className="text-[11px] px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full font-semibold">
                    {notifications.filter(n => !n.read).length} New
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {notifications.filter(n => !n.read).length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                      <CircleDot className="h-6 w-6 text-gray-300" />
                      <span>All clear! No new notifications.</span>
                    </div>
                  ) : (
                    notifications.filter(n => !n.read).map((n) => (
                      <div key={n._id} className="p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                        <div className="h-2 w-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-[13px] text-gray-700 leading-normal">{n.message}</p>
                          <span className="text-[11px] text-gray-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button
                          onClick={() => markAsRead(n._id)}
                          className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors shrink-0"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Nested Content & MiddlePanel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main content scroll area */}
          <main className="flex-1 min-w-0 overflow-y-auto px-8 xl:px-12 py-8 max-w-[1400px] w-full mx-auto">
            <Outlet />
          </main>

          {/* Middle panel on the right of the main content, only on dashboard */}
          {showMiddlePanel && (
            <div className="hidden lg:block w-[280px] shrink-0 border-l border-gray-250 bg-white overflow-y-auto">
              <MiddlePanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
