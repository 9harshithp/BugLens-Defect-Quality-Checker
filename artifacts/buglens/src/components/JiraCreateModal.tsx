import { useState, useEffect } from 'react';
import { gradeMeta, scoreColor } from '../lib/analysis';
import type { AnalysisResult } from '../lib/types';

interface JiraProject { id: string; key: string; name: string; }

interface Props {
  result: AnalysisResult;
  title: string;
  onClose: () => void;
}

export function JiraCreateModal({ result, title, onClose }: Props) {
  const [projects, setProjects]     = useState<JiraProject[]>([]);
  const [loading, setLoading]       = useState(true);
  const [connErr, setConnErr]       = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [creating, setCreating]     = useState(false);
  const [created, setCreated]       = useState<{ key: string; browseUrl: string } | null>(null);
  const [createErr, setCreateErr]   = useState('');

  useEffect(() => {
    fetch('/api/jira/projects')
      .then(r => r.json())
      .then((d: { values?: JiraProject[]; error?: string }) => {
        if (d.error) { setConnErr(d.error); setLoading(false); return; }
        const list: JiraProject[] = d.values ?? [];
        setProjects(list);
        if (list.length > 0) setSelectedKey(list[0].key);
        setLoading(false);
      })
      .catch(() => { setConnErr('Could not reach API — is the server running?'); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    if (!selectedKey) return;
    setCreating(true);
    setCreateErr('');
    try {
      const resp = await fetch('/api/jira/create-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectKey: selectedKey,
          summary: title,
          description: result.rewritten_report,
          priority: result.risk_level.toLowerCase(),
        }),
      });
      const d = await resp.json() as { key?: string; browseUrl?: string; error?: unknown };
      if (!resp.ok) throw new Error(typeof d.error === 'string' ? d.error : JSON.stringify(d.error));
      setCreated({ key: d.key!, browseUrl: d.browseUrl! });
    } catch (e) {
      setCreateErr(e instanceof Error ? e.message : 'Failed to create issue');
    } finally {
      setCreating(false);
    }
  };

  const gm = gradeMeta(result.overall_score);
  const col = scoreColor(result.overall_score);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,23,20,.55)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fffefb', borderRadius: 18, border: '1px solid #d4cfc5',
        padding: '1.8rem', width: '100%', maxWidth: 500,
        boxShadow: '0 16px 48px rgba(26,23,20,.18)', position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.2rem' }}>
          <div style={{ width: 32, height: 32, background: '#1868DB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '.85rem', fontFamily: 'monospace' }}>J</span>
          </div>
          <div>
            <div className="bl-serif" style={{ fontSize: '1.05rem', color: '#1a1714' }}>Create Jira Issue</div>
            <div className="bl-mono" style={{ fontSize: '.68rem', color: '#a09a92' }}>// Bug report → Jira ticket</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#a09a92', lineHeight: 1 }}>✕</button>
        </div>

        {/* Score preview */}
        <div style={{ background: '#f5f2ee', border: '1px solid #d4cfc5', borderRadius: 10, padding: '.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.8rem' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '1.1rem', color: col }}>{result.overall_score}/100</div>
          <div style={{ display: 'inline-block', padding: '.18rem .7rem', background: gm.bg, color: gm.color, borderRadius: 12, fontSize: '.72rem', fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{gm.label}</div>
          <div style={{ fontSize: '.8rem', color: '#4a4540', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        </div>

        {created ? (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>✅</div>
            <div className="bl-serif" style={{ fontSize: '1.1rem', color: '#1a1714', marginBottom: '.3rem' }}>Issue created!</div>
            <a href={created.browseUrl} target="_blank" rel="noreferrer"
              style={{ fontFamily: "'DM Mono', monospace", color: '#1868DB', fontWeight: 700, fontSize: '.9rem', textDecoration: 'none' }}>
              {created.key} ↗
            </a>
            <div style={{ marginTop: '1.2rem' }}>
              <button className="bl-btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', color: '#7a756e', fontSize: '.83rem', fontFamily: "'DM Mono', monospace", padding: '.5rem 0' }}>
                <div className="bl-spin" /> Loading projects...
              </div>
            )}

            {connErr && (
              <div style={{ background: '#fef2ee', border: '1px solid #f8c4b0', color: '#c4410c', fontSize: '.8rem', padding: '.7rem .9rem', borderRadius: 8, fontFamily: "'DM Mono', monospace", marginBottom: '.9rem' }}>
                ⚠ {connErr}
              </div>
            )}

            {!loading && !connErr && (
              <>
                <div className="bl-field" style={{ marginBottom: '1rem' }}>
                  <label className="bl-label">Jira Project</label>
                  <select className="bl-input" value={selectedKey} onChange={e => setSelectedKey(e.target.value)}
                    style={{ cursor: 'pointer' }}>
                    {projects.map(p => (
                      <option key={p.key} value={p.key}>{p.key} — {p.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: '#f0ede7', borderRadius: 8, padding: '.65rem .85rem', fontSize: '.75rem', fontFamily: "'DM Mono', monospace", color: '#7a756e', marginBottom: '1rem', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, color: '#4a4540', marginBottom: '.25rem' }}>Will create:</div>
                  <div>Type: Bug · Priority: {result.risk_level}</div>
                  <div style={{ marginTop: '.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Summary: {title}
                  </div>
                  <div style={{ marginTop: '.2rem' }}>Description: professional rewrite ({result.rewritten_report.length} chars)</div>
                </div>

                {createErr && (
                  <div style={{ background: '#fef2ee', border: '1px solid #f8c4b0', color: '#c4410c', fontSize: '.78rem', padding: '.6rem .8rem', borderRadius: 8, fontFamily: "'DM Mono', monospace", marginBottom: '.8rem' }}>
                    ⚠ {createErr}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
                  <button className="bl-btn-secondary" onClick={onClose}>Cancel</button>
                  <button
                    disabled={creating || !selectedKey}
                    onClick={handleCreate}
                    style={{
                      padding: '.52rem 1.1rem', background: creating ? '#1050a0' : '#1868DB',
                      color: '#fff', border: 'none', borderRadius: 10, cursor: creating ? 'default' : 'pointer',
                      fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '.85rem',
                      display: 'inline-flex', alignItems: 'center', gap: '.4rem', transition: 'background .15s',
                    }}
                    onMouseEnter={e => { if (!creating) (e.currentTarget as HTMLButtonElement).style.background = '#1050a0'; }}
                    onMouseLeave={e => { if (!creating) (e.currentTarget as HTMLButtonElement).style.background = '#1868DB'; }}
                  >
                    {creating ? <><div className="bl-spin" style={{ width: 12, height: 12, borderWidth: 2 }} /> Creating...</> : '📋 Create Issue'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
