import React, { useContext, useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, Check, CircleDot } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import useNotifications from '../hooks/useNotifications';
import HealAraLogo from './HealAraLogo';

export default function Topbar() {
  const { user } = useContext(AuthContext);
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
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 56,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 50,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* LEFT — Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <HealAraLogo size="sm" showWordmark={false} />
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            lineHeight: 1,
          }}
        >
          <span style={{ color: '#0F172A' }}>Heal</span>
          <span style={{ color: '#0D9488' }}>Ara</span>
        </span>
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Bell */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowNotif(v => !v)}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              color: '#64748B',
            }}
            aria-label="Notifications"
          >
            <Bell size={20} color="#64748B" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#EF4444',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 9999,
                  minWidth: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 320,
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 100,
                maxHeight: 380,
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: 10, background: '#F0FDFA', color: '#0D9488', borderRadius: 9999, padding: '2px 8px', fontWeight: 600 }}>
                    {unreadCount} New
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
                  <CircleDot size={20} style={{ margin: '0 auto 8px', display: 'block', color: '#CBD5E1' }} />
                  All clear! No new notifications.
                </div>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <div
                    key={n._id}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      borderBottom: '1px solid #F8FAFC',
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D9488', marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, margin: 0 }}>{n.message}</p>
                      <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, display: 'block' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={() => markAsRead(n._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
                      title="Mark as read"
                    >
                      <Check size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#0D9488',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        {/* Name */}
        <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
          {user?.name}
        </span>

        <ChevronDown size={16} color="#94A3B8" />
      </div>
    </header>
  );
}
