import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Pill,
  AlertTriangle,
  LogOut,
  Brain,
  User
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  // Define links in required order
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/log', label: 'Log Vitals', icon: Activity },
    { to: '/trends', label: 'Trends', icon: TrendingUp },
    { to: '/medications', label: 'Medications', icon: Pill },
    { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
    { to: '/advisor', label: 'AI Advisor', icon: Brain },
    { to: '/settings', label: 'Settings', icon: User }
  ];

  // Helper for initials
  const initials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <aside className="flex flex-col w-[260px] min-w-[260px] max-w-[260px] h-screen bg-white border-r border-[#e5e7eb] overflow-hidden fixed left-0 top-0">
      {/* SECTION 1 – Top Logo */}
      <div className="flex flex-col items-center border-b border-[#e5e7eb] p-5 max-h-[108px]">
        <div className="flex items-center space-x-2.5">
          {/* Static simple H logo */}
          <svg width="42" height="42" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[42px] w-[42px]">
            <circle cx="20" cy="20" r="20" fill="#0F6E56" />
            <text x="50%" y="55%" textAnchor="middle" fill="white" fontSize="20" fontFamily="Arial" fontWeight="bold">H</text>
          </svg>
          <span className="text-[22px] font-bold text-[#1a1a1a]">HealAra</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5 tracking-wide">MIND · BODY · NUTRITION · AI</p>
      </div>

      {/* SECTION 2 – Menu Items */}
      <nav className="flex-1 flex flex-col px-3 py-3 space-y-1 overflow-y-auto">
        {links.map(link => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 h-[50px] text-[15px] px-3 rounded-[8px] ${
                  isActive
                    ? 'bg-[#E6F4F1] text-[#0F6E56] border-l-[3px] border-[#0F6E56] font-semibold'
                    : 'text-[#6B7280] hover:bg-[#F0FAF7] hover:text-[#0F6E56]'
                }`
              }
            >
              <Icon className="h-[22px] w-[22px]" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* SECTION 3 – Bottom User Profile */}
      <div className="border-t border-[#e5e7eb] p-4 flex flex-col items-start">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#0F6E56] flex items-center justify-center text-white font-bold text-[15px] shrink-0">
            {initials}
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="text-[14px] font-bold text-[#1a1a1a] truncate">{user.name}</h4>
            <p className="text-[12px] text-gray-500 truncate capitalize mt-0.5">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
