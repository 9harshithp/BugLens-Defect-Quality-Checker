import type { User } from '../lib/types';
import { Shield, Sliders, User as UserIcon } from 'lucide-react';

interface Props {
  user: User;
  useAi: boolean;
  onToggleAi: (v: boolean) => void;
}

export function SettingsPage({ user, useAi, onToggleAi }: Props) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.8rem' }}>
        <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Settings</h1>
        <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>
          // Account profile &amp; analysis preferences
        </p>
      </div>

      <div className="bl-card">
        <div className="bl-card-title" style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
          <UserIcon size={15} /> Account Profile
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <div className="bl-label">Display Name</div>
            <div style={{ fontSize: '.92rem', fontWeight: 600, color: '#1a1714' }}>{user.name}</div>
          </div>
          <div>
            <div className="bl-label">Username</div>
            <div className="bl-mono" style={{ fontSize: '.88rem', color: '#4a4540' }}>{user.username}</div>
          </div>
          <div>
            <div className="bl-label">Role</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.2rem .65rem', borderRadius: 12, background: '#f0ede7', fontSize: '.78rem', fontWeight: 600, color: '#1a1714' }}>
              <Shield size={13} /> {user.role}
            </div>
          </div>
        </div>
      </div>

      <div className="bl-card">
        <div className="bl-card-title" style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
          <Sliders size={15} /> Analysis Engine
        </div>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}>
          <div>
            <div style={{ fontSize: '.9rem', fontWeight: 600, color: '#1a1714' }}>
              Enable Optional AI Enhancement (Server-side)
            </div>
            <div className="bl-mono" style={{ fontSize: '.74rem', color: '#7a756e', marginTop: 3 }}>
              Uses backend AI provider when configured; automatically falls back to deterministic rule-based scoring if unavailable.
            </div>
          </div>
          <input
            type="checkbox"
            checked={useAi}
            onChange={e => onToggleAi(e.target.checked)}
            data-testid="toggle-ai-analysis"
            style={{ width: 18, height: 18, accentColor: '#c4410c', cursor: 'pointer' }}
          />
        </label>
      </div>
    </div>
  );
}

