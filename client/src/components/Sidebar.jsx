import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Heart, Activity, Pill, Calendar,
  FileText, Target, MessageCircle, Settings, Headphones,
  LogOut
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      to: '/dashboard' },
  { icon: Heart,           label: 'Health Overview', to: '/trends'    },
  { icon: Activity,        label: 'Metrics',         to: '/alerts'    },
  { icon: Pill,            label: 'Medications',     to: '/medications'},
  { icon: Calendar,        label: 'Appointments',    to: '#'          },
  { icon: FileText,        label: 'Reports',         to: '#'          },
  { icon: Target,          label: 'Goals',           to: '#'          },
  { icon: MessageCircle,   label: 'Messages',        to: '#'          },
  { icon: Settings,        label: 'Settings',        to: '/settings'  },
];

export default function Sidebar() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col fixed top-[56px] left-0 z-40 bg-white border-r border-slate-200 overflow-hidden"
        style={{ width: 200, height: 'calc(100vh - 56px)' }}
      >
        {/* Nav items */}
        <nav className="flex-1 pt-3 overflow-y-auto scrollbar-none">
          {navItems.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-[10px] mx-2 my-0.5 px-4 rounded-lg transition-all duration-150 cursor-pointer select-none ${
                  isActive
                    ? 'bg-teal-50 text-teal-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`
              }
              style={{ height: 42, fontSize: 14, fontWeight: 500 }}
              onClick={e => { if (to === '#') e.preventDefault(); }}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    className={isActive ? 'text-teal-600' : 'text-slate-400'}
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto p-3">
          {/* Need Help card */}
          <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-3">
            <div className="flex items-center gap-2 mb-0.5">
              <Headphones size={16} className="text-teal-600 shrink-0" />
              <span className="text-[13px] font-semibold text-slate-900">Need Help?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight pl-6">Talk to our support team</p>
          </div>
          <button className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2 text-[13px] font-medium transition-colors">
            Contact Support
          </button>

          {/* Logout */}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 w-full mt-3 px-4 py-2.5 text-slate-400 hover:text-red-500 text-sm transition-colors rounded-lg hover:bg-red-50"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex">
        {navItems.slice(0, 5).map(({ icon: Icon, label, to }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-teal-600' : 'text-slate-400'
              }`
            }
            onClick={e => { if (to === '#') e.preventDefault(); }}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
