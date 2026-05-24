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
  Stethoscope,
  User,
  Shield,
  Brain
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  const patientLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/log', label: 'Log Vitals', icon: Activity },
    { to: '/trends', label: 'Trends', icon: TrendingUp },
    { to: '/medications', label: 'Medications', icon: Pill },
    { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
    { to: '/advisor', label: 'AI Advisor', icon: Brain },
    { to: '/settings', label: 'Settings', icon: User }
  ];

  const doctorLinks = [
    { to: '/doctor', label: 'Doctor Portal', icon: Stethoscope }
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Panel', icon: Shield }
  ];

  let links = [];
  if (user.role === 'admin') {
    links = adminLinks;
  } else if (user.role === 'doctor') {
    links = doctorLinks;
  } else {
    links = patientLinks;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-150 h-screen z-20">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Activity className="h-6 w-6 text-teal-600" />
          <span className="font-bold text-xl tracking-tight text-teal-600">VitalTrack</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-teal-50 text-teal-600 shadow-sm border-l-4 border-teal-600' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold text-sm">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-gray-900 truncate">{user.name}</h4>
              <p className="text-xs text-gray-500 capitalize truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-30 px-2 shadow-lg">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex flex-col items-center justify-center py-1 px-3 rounded-md text-xs font-medium transition-all ${
                  isActive 
                    ? 'text-teal-600' 
                    : 'text-gray-400 hover:text-gray-700'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px]">{link.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-md text-xs font-medium text-red-500"
        >
          <LogOut className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Logout</span>
        </button>
      </nav>
    </>
  );
}
