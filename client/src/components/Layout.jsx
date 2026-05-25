import React, { useState, useContext, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AuthContext } from '../context/AuthContext';
import useNotifications from '../hooks/useNotifications';
import { Bell, Check, CircleDot } from 'lucide-react';

export default function Layout() {
  const { user } = useContext(AuthContext);
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-60 min-w-0 pb-16 md:pb-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
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
              <Bell className="h-5.5 w-5.5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-2 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Unread Alerts</span>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full font-semibold">
                    {notifications.length} New
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                      <CircleDot className="h-6 w-6 text-gray-300" />
                      <span>All clear! No new notifications.</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} className="p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                        <div className="h-2 w-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-700 leading-normal">{n.message}</p>
                          <span className="text-[9px] text-gray-400 mt-1 block">
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

        {/* Dynamic Nested Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
