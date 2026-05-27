import { useState } from 'react';

interface Props {
  onLogin: (username: string, password: string) => boolean;
  onSignup: (username: string, password: string, name: string, role: string) => { ok: boolean; error?: string };
}

const DEMO_ACCOUNTS = [
  { role: 'Admin',     username: 'admin',    password: 'admin123' },
  { role: 'QA Lead',   username: 'qa_lead',  password: 'qa1234'   },
  { role: 'Developer', username: 'dev_user', password: 'dev5678'  },
  { role: 'Analyst',   username: 'analyst',  password: 'pass2024' },
];

const ROLES = ['QA Engineer', 'QA Lead', 'Developer', 'Analyst', 'Admin', 'Product Manager', 'DevOps'];

export function LoginPage({ onLogin, onSignup }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup state
  const [signName, setSignName]   = useState('');
  const [signUser, setSignUser]   = useState('');
  const [signPass, setSignPass]   = useState('');
  const [signRole, setSignRole]   = useState('QA Engineer');
  const [signError, setSignError] = useState('');

  const handleLogin = (u = loginUser, p = loginPass) => {
    const ok = onLogin(u, p);
    if (!ok) { setLoginError('Invalid username or password.'); setLoginPass(''); }
    else setLoginError('');
  };

  const handleSignup = () => {
    const res = onSignup(signUser.trim(), signPass, signName.trim(), signRole);
    if (!res.ok) { setSignError(res.error || 'Signup failed.'); }
    else setSignError('');
  };

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setLoginError(''); setSignError('');
  };

  const QUOTE = 'BugLens — Defect Quality Checker · "Turning confusion into clarity." · ';
  const REPEAT = QUOTE.repeat(12);

  return (
    <div className="bl-login-bg">
      <div className="bl-login-blob" />
      <div className="bl-login-grid" />

      <div className="bl-login-marquee">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bl-login-marquee-row">
            <span className="bl-login-marquee-text">{REPEAT}</span>
            <span className="bl-login-marquee-text" aria-hidden="true">{REPEAT}</span>
          </div>
        ))}
      </div>

      <div className="bl-login-card">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.6rem' }}>
          <div style={{ width: 38, height: 38, background: '#1a1714', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 22 22" fill="none" width={22} height={22}>
              <circle cx="11" cy="11" r="9" stroke="#4ade80" strokeWidth="1.5"/>
              <path d="M7 11l3 3 5-5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="bl-serif" style={{ fontSize: '1.4rem', color: '#1a1714' }}>
            Bug<em style={{ color: '#c4410c', fontStyle: 'normal' }}>Lens</em>
          </div>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', background: '#f0ede7', borderRadius: 10, padding: 3, marginBottom: '1.5rem' }}>
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: '.5rem', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '.85rem',
                fontWeight: mode === m ? 600 : 400,
                background: mode === m ? '#fffefb' : 'transparent',
                color: mode === m ? '#1a1714' : '#7a756e',
                boxShadow: mode === m ? '0 1px 3px rgba(26,23,20,.08)' : 'none',
                transition: 'all .15s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <>
            <h2 className="bl-serif" style={{ fontSize: '1.45rem', color: '#1a1714', marginBottom: '.18rem' }}>Welcome back</h2>
            <p className="bl-mono" style={{ fontSize: '.8rem', color: '#7a756e', marginBottom: '1.5rem' }}>// AI-powered defect quality platform</p>

            {loginError && (
              <div style={{ background: '#fef2ee', border: '1px solid #f8c4b0', color: '#c4410c', fontSize: '.8rem', padding: '.6rem .8rem', borderRadius: 10, marginBottom: '.9rem', fontFamily: "'DM Mono', monospace" }}>
                {loginError}
              </div>
            )}

            <div style={{ marginBottom: '.9rem' }}>
              <label className="bl-mono" style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#4a4540', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Username</label>
              <input className="bl-input" type="text" placeholder="Enter username" value={loginUser}
                onChange={e => setLoginUser(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                data-testid="input-username" autoComplete="username" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="bl-mono" style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#4a4540', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Password</label>
              <input className="bl-input" type="password" placeholder="Enter password" value={loginPass}
                onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                data-testid="input-password" autoComplete="current-password" />
            </div>

            <button className="bl-btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => handleLogin()} data-testid="button-signin">
              Sign In →
            </button>

            <div style={{ marginTop: '1.4rem', paddingTop: '1.1rem', borderTop: '1px solid #d4cfc5' }}>
              <p className="bl-mono" style={{ fontSize: '.77rem', color: '#a09a92', marginBottom: '.5rem' }}>// Demo accounts — click to sign in instantly</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.username} onClick={() => handleLogin(acc.username, acc.password)}
                    data-testid={`button-demo-${acc.username}`}
                    style={{ background: '#f0ede7', border: '1px solid #d4cfc5', borderRadius: 8, padding: '.55rem .75rem', cursor: 'pointer', textAlign: 'left', transition: 'background .12s', width: '100%' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e8e4dc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f0ede7')}>
                    <div className="bl-mono" style={{ fontSize: '.67rem', color: '#a09a92', textTransform: 'uppercase', letterSpacing: '.05em' }}>{acc.role}</div>
                    <div style={{ fontSize: '.8rem', fontWeight: 500, color: '#4a4540', marginTop: 2 }}>{acc.username} / {acc.password}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="bl-serif" style={{ fontSize: '1.45rem', color: '#1a1714', marginBottom: '.18rem' }}>Create your account</h2>
            <p className="bl-mono" style={{ fontSize: '.8rem', color: '#7a756e', marginBottom: '1.5rem' }}>// Free — no credit card required</p>

            {signError && (
              <div style={{ background: '#fef2ee', border: '1px solid #f8c4b0', color: '#c4410c', fontSize: '.8rem', padding: '.6rem .8rem', borderRadius: 10, marginBottom: '.9rem', fontFamily: "'DM Mono', monospace" }}>
                {signError}
              </div>
            )}

            <div style={{ marginBottom: '.85rem' }}>
              <label className="bl-mono" style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#4a4540', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Full Name</label>
              <input className="bl-input" type="text" placeholder="e.g. Jamie Lee" value={signName}
                onChange={e => setSignName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignup()}
                data-testid="input-signup-name" autoComplete="name" />
            </div>
            <div style={{ marginBottom: '.85rem' }}>
              <label className="bl-mono" style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#4a4540', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Username</label>
              <input className="bl-input" type="text" placeholder="e.g. jamie_lee" value={signUser}
                onChange={e => setSignUser(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                onKeyDown={e => e.key === 'Enter' && handleSignup()}
                data-testid="input-signup-username" autoComplete="username" />
              <div className="bl-mono" style={{ fontSize: '.67rem', color: '#a09a92', marginTop: 3 }}>Min 3 chars, letters / numbers / underscores</div>
            </div>
            <div style={{ marginBottom: '.85rem' }}>
              <label className="bl-mono" style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#4a4540', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Password</label>
              <input className="bl-input" type="password" placeholder="Min 6 characters" value={signPass}
                onChange={e => setSignPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignup()}
                data-testid="input-signup-password" autoComplete="new-password" />
            </div>
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="bl-mono" style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#4a4540', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Role</label>
              <select className="bl-select" value={signRole} onChange={e => setSignRole(e.target.value)} data-testid="select-signup-role">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <button className="bl-btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#1d6b4e' }}
              onClick={handleSignup} data-testid="button-signup"
              onMouseEnter={e => (e.currentTarget.style.background = '#165a3f')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1d6b4e')}>
              Create Account →
            </button>

            <p style={{ textAlign: 'center', fontSize: '.8rem', color: '#a09a92', marginTop: '1rem', fontFamily: "'DM Mono', monospace" }}>
              Already have an account?{' '}
              <button onClick={() => switchMode('login')}
                style={{ background: 'none', border: 'none', color: '#c4410c', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: '.8rem', fontWeight: 600, padding: 0 }}>
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
