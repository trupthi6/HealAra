import React, { useContext, useState, useRef, useEffect } from 'react';
import { HeartPulse, Bell, ChevronDown, Check, CircleDot } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import useNotifications from '../hooks/useNotifications';

export default function Topbar() {
  const { user, logout } = useContext(AuthContext);
  const { notifications, markAsRead } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200"
      style={{ height: 56 }}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <HeartPulse size={22} className="text-teal-600" />
          <span
            className="text-[18px] font-bold text-slate-900"
            style={{ letterSpacing: '-0.3px' }}
          >
            VitalTrack
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotif(v => !v)}
              className="relative p-1 text-slate-500 hover:text-teal-600 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-slate-500" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full font-semibold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <CircleDot size={20} className="text-slate-300" />
                      <span>All clear! No new notifications.</span>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div key={n._id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                        <div className="h-2 w-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-700 leading-normal">{n.message}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button
                          onClick={() => markAsRead(n._id)}
                          className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors shrink-0"
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div
            className="w-[34px] h-[34px] rounded-full bg-teal-600 flex items-center justify-center text-white text-[13px] font-semibold shrink-0"
          >
            {initials}
          </div>

          {/* User name */}
          <span className="text-sm font-medium text-slate-900 hidden sm:block">{user?.name}</span>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
