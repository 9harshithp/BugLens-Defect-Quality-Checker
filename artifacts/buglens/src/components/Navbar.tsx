import type { User, AppView } from '../lib/types';
import { Search, Scale, History, BarChart3, Settings, type LucideIcon } from 'lucide-react';

interface Props {
  user: User;
  activeView: AppView;
  onViewChange: (v: AppView) => void;
  onLogout: () => void;
}

const TABS: { id: AppView; label: string; Icon: LucideIcon }[] = [
  { id: 'checker',   label: 'Analyzer',  Icon: Search },
  { id: 'compare',   label: 'Compare',   Icon: Scale },
  { id: 'history',   label: 'History',   Icon: History },
  { id: 'dashboard', label: 'Dashboard', Icon: BarChart3 },
  { id: 'settings',  label: 'Settings',  Icon: Settings },
];

export function Navbar({ user, activeView, onViewChange, onLogout }: Props) {
  return (
    <nav style={{
      background: '#fffefb',
      borderBottom: '1px solid #d4cfc5',
      padding: '0 1.5rem',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: '#1a1714', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 22 22" fill="none" width={18} height={18}>
              <circle cx="11" cy="11" r="9" stroke="#4ade80" strokeWidth="1.5"/>
              <path d="M7 11l3 3 5-5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="bl-serif" style={{ fontSize: '1.1rem', color: '#1a1714' }}>
            Bug<em style={{ color: '#c4410c', fontStyle: 'normal' }}>Lens</em>
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: '#d4cfc5', margin: '0 6px' }} />

        {/* Tabs */}
        {TABS.map(tab => {
          const isActive = activeView === tab.id;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              data-testid={`tab-${tab.id}`}
              style={{
                padding: '.32rem .72rem', borderRadius: 7,
                fontSize: '.82rem', fontWeight: isActive ? 600 : 500,
                color: isActive ? '#1a1714' : '#7a756e',
                cursor: 'pointer', border: 'none',
                background: isActive ? '#f0ede7' : 'transparent',
                fontFamily: "'Outfit', sans-serif",
                transition: 'all .12s',
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: '.35rem',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f0ede7'; e.currentTarget.style.color = '#1a1714'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7a756e'; } }}
            >
              <Icon size={14} strokeWidth={2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '.3rem .7rem', background: '#f0ede7', borderRadius: 20 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#c4410c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, color: '#fff' }}>
            {user.name[0]}
          </div>
          <div>
            <div style={{ fontSize: '.8rem', fontWeight: 500, color: '#4a4540' }}>{user.name}</div>
            <div className="bl-mono" style={{ fontSize: '.65rem', color: '#a09a92', textTransform: 'uppercase' }}>{user.role}</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          data-testid="button-signout"
          style={{
            padding: '.32rem .72rem', background: 'transparent',
            border: '1px solid #d4cfc5', borderRadius: 7,
            fontSize: '.78rem', color: '#7a756e',
            cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            transition: 'all .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0ede7'; e.currentTarget.style.color = '#1a1714'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7a756e'; }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
