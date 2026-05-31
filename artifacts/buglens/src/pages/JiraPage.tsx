import { useState, useEffect } from 'react';
import { ruleBasedAnalysis, scoreColor, gradeMeta } from '../lib/analysis';
import type { AnalysisResult } from '../lib/types';
import { JiraCreateModal } from '../components/JiraCreateModal';

interface JiraProject { id: string; key: string; name: string; }

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: unknown;
    issuetype: { name: string };
    priority?: { name: string };
    status: { name: string };
    reporter?: { displayName: string };
    created: string;
  };
}

interface ConnectionInfo { connected: boolean; displayName?: string; email?: string; error?: string; }

function adfToText(node: unknown): string {
  if (typeof node !== 'object' || !node) return '';
  const n = node as Record<string, unknown>;
  if (n.type === 'text') return String(n.text ?? '');
  if (Array.isArray(n.content)) {
    const sep = ['paragraph', 'bulletList', 'orderedList', 'listItem', 'heading'].includes(String(n.type)) ? '\n' : ' ';
    return (n.content as unknown[]).map(adfToText).join(sep).trim();
  }
  return '';
}

function jiraPriorityToSev(p?: string): string {
  const v = p?.toLowerCase() ?? '';
  if (['critical', 'highest', 'blocker'].includes(v)) return 'critical';
  if (['high', 'major'].includes(v)) return 'high';
  if (['low', 'minor', 'trivial', 'lowest'].includes(v)) return 'low';
  return 'medium';
}

function scoreIssue(issue: JiraIssue): AnalysisResult {
  return ruleBasedAnalysis({
    title: issue.fields.summary,
    desc:  adfToText(issue.fields.description),
    steps: '',
    exp:   '',
    act:   '',
    env:   '',
    sev:   jiraPriorityToSev(issue.fields.priority?.name),
    pri:   issue.fields.priority?.name ?? '',
    comp:  '',
    rep:   issue.fields.reporter?.displayName ?? '',
    exc:   '',
    att:   '',
  });
}

export function JiraPage() {
  const [conn, setConn]               = useState<ConnectionInfo | null>(null);
  const [projects, setProjects]       = useState<JiraProject[]>([]);
  const [loadingProj, setLoadingProj] = useState(true);
  const [selProject, setSelProject]   = useState('');
  const [issues, setIssues]           = useState<JiraIssue[]>([]);
  const [scored, setScored]           = useState<Map<string, AnalysisResult>>(new Map());
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [issueErr, setIssueErr]       = useState('');
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [jiraModal, setJiraModal]     = useState<{ result: AnalysisResult; title: string } | null>(null);

  useEffect(() => {
    fetch('/api/jira/status')
      .then(r => r.json())
      .then((d: ConnectionInfo) => setConn(d))
      .catch(() => setConn({ connected: false, error: 'Could not reach API server' }));

    fetch('/api/jira/projects')
      .then(r => r.json())
      .then((d: { values?: JiraProject[] }) => {
        const list = d.values ?? [];
        setProjects(list);
        if (list.length > 0) setSelProject(list[0].key);
        setLoadingProj(false);
      })
      .catch(() => setLoadingProj(false));
  }, []);

  const handleLoad = async () => {
    if (!selProject) return;
    setLoadingIssues(true);
    setIssueErr('');
    setIssues([]);
    setScored(new Map());
    setExpanded(null);
    try {
      const resp = await fetch(`/api/jira/issues?projectKey=${selProject}&maxResults=25`);
      const d = await resp.json() as { issues?: JiraIssue[]; error?: string };
      if (!resp.ok || d.error) throw new Error(d.error ?? 'Failed to load issues');
      const list = d.issues ?? [];
      setIssues(list);
      const m = new Map<string, AnalysisResult>();
      list.forEach(issue => m.set(issue.id, scoreIssue(issue)));
      setScored(m);
    } catch (e) {
      setIssueErr(e instanceof Error ? e.message : 'Error loading issues');
    } finally {
      setLoadingIssues(false);
    }
  };

  const statusDot = conn === null ? '#a09a92' : conn.connected ? '#1d6b4e' : '#c4410c';
  const statusText = conn === null ? 'Checking connection…' : conn.connected
    ? `Connected — ${conn.displayName} (${conn.email})`
    : `Not connected — ${conn.error}`;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.3rem' }}>
          <div style={{ width: 32, height: 32, background: '#1868DB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '.85rem', fontFamily: 'monospace' }}>J</span>
          </div>
          <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Jira Integration</h1>
        </div>
        <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>
          // import issues from your project · score their quality · push quality reports back to Jira
        </p>
      </div>

      {/* Connection status */}
      <div style={{ background: '#fffefb', border: '1px solid #d4cfc5', borderRadius: 12, padding: '.85rem 1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '.7rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusDot, flexShrink: 0 }} />
        <div className="bl-mono" style={{ fontSize: '.8rem', color: conn?.connected ? '#1d6b4e' : '#c4410c' }}>{statusText}</div>
        {!conn?.connected && (
          <div style={{ marginLeft: 'auto', fontSize: '.75rem', color: '#a09a92', fontFamily: "'DM Mono', monospace" }}>
            Add JIRA_HOST · JIRA_EMAIL · JIRA_API_TOKEN secrets in Replit
          </div>
        )}
      </div>

      {/* Project picker */}
      <div className="bl-card" style={{ marginBottom: '1.5rem' }}>
        <div className="bl-card-title">📁 Import & Score Issues</div>
        <div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="bl-field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label className="bl-label">Jira Project</label>
            {loadingProj ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.55rem .8rem', background: '#f5f2ee', borderRadius: 8, fontSize: '.82rem', fontFamily: "'DM Mono', monospace", color: '#a09a92' }}>
                <div className="bl-spin" style={{ width: 12, height: 12, borderWidth: 2 }} /> Loading projects…
              </div>
            ) : (
              <select className="bl-input" value={selProject} onChange={e => setSelProject(e.target.value)} style={{ cursor: 'pointer' }}>
                {projects.length === 0 && <option value="">No projects found</option>}
                {projects.map(p => <option key={p.key} value={p.key}>{p.key} — {p.name}</option>)}
              </select>
            )}
          </div>
          <button
            onClick={handleLoad}
            disabled={loadingIssues || !selProject || !conn?.connected}
            style={{
              padding: '.55rem 1.2rem', background: loadingIssues ? '#a33008' : '#c4410c',
              color: '#fff', border: 'none', borderRadius: 10, cursor: loadingIssues ? 'default' : 'pointer',
              fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '.85rem',
              display: 'inline-flex', alignItems: 'center', gap: '.4rem', transition: 'background .15s',
              opacity: !conn?.connected ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!loadingIssues && conn?.connected) (e.currentTarget as HTMLButtonElement).style.background = '#a33008'; }}
            onMouseLeave={e => { if (!loadingIssues && conn?.connected) (e.currentTarget as HTMLButtonElement).style.background = '#c4410c'; }}
          >
            {loadingIssues ? <><div className="bl-spin" style={{ width: 12, height: 12, borderWidth: 2 }} /> Loading…</> : '🔍 Load Issues'}
          </button>
        </div>
        {issueErr && (
          <div style={{ marginTop: '.8rem', background: '#fef2ee', border: '1px solid #f8c4b0', color: '#c4410c', fontSize: '.78rem', padding: '.6rem .8rem', borderRadius: 8, fontFamily: "'DM Mono', monospace" }}>
            ⚠ {issueErr}
          </div>
        )}
      </div>

      {/* Issues table */}
      {issues.length > 0 && (
        <div className="bl-card">
          <div className="bl-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📋 Issues ({issues.length})</span>
            <span className="bl-mono" style={{ fontSize: '.7rem', color: '#a09a92', fontWeight: 400 }}>
              Avg score: {Math.round(Array.from(scored.values()).reduce((s, r) => s + r.overall_score, 0) / scored.size)}/100
            </span>
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 90px 110px 80px', gap: '.5rem', padding: '.5rem .7rem', borderBottom: '1px solid #e8e2d8', marginBottom: '.2rem' }}>
            {['KEY', 'SUMMARY', 'TYPE', 'PRIORITY', 'STATUS', 'SCORE'].map(h => (
              <div key={h} className="bl-mono" style={{ fontSize: '.62rem', color: '#a09a92', textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {issues.map(issue => {
            const res = scored.get(issue.id);
            const isOpen = expanded === issue.id;
            const col = res ? scoreColor(res.overall_score) : '#a09a92';
            const gm  = res ? gradeMeta(res.overall_score) : null;

            return (
              <div key={issue.id}>
                <div
                  onClick={() => setExpanded(isOpen ? null : issue.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '90px 1fr 90px 90px 110px 80px',
                    gap: '.5rem', padding: '.6rem .7rem', cursor: 'pointer', borderRadius: 8,
                    transition: 'background .12s',
                    background: isOpen ? '#f5f2ee' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLDivElement).style.background = '#faf8f5'; }}
                  onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div className="bl-mono" style={{ fontSize: '.78rem', color: '#1868DB', fontWeight: 600 }}>{issue.key}</div>
                  <div style={{ fontSize: '.82rem', color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.fields.summary}</div>
                  <div style={{ fontSize: '.72rem', color: '#7a756e' }}>{issue.fields.issuetype.name}</div>
                  <div style={{ fontSize: '.72rem', color: '#7a756e' }}>{issue.fields.priority?.name ?? '—'}</div>
                  <div>
                    <span style={{ display: 'inline-block', padding: '.12rem .55rem', borderRadius: 20, fontSize: '.68rem', background: '#f0ede7', color: '#4a4540', fontFamily: "'DM Mono', monospace" }}>
                      {issue.fields.status.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '.85rem', color: col }}>{res?.overall_score ?? '…'}</span>
                    {gm && <span style={{ padding: '.08rem .45rem', borderRadius: 8, fontSize: '.63rem', fontWeight: 600, fontFamily: "'DM Mono', monospace", background: gm.bg, color: gm.color }}>{gm.label}</span>}
                  </div>
                </div>

                {/* Expanded analysis */}
                {isOpen && res && (
                  <div style={{ margin: '.4rem .7rem 1rem', background: '#f5f2ee', border: '1px solid #e8e2d8', borderRadius: 10, padding: '1rem' }}>
                    {/* Score bars */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem', marginBottom: '.9rem' }}>
                      {[
                        { l: 'Title',    v: res.section_scores.title,           m: 20 },
                        { l: 'Desc',     v: res.section_scores.description,     m: 20 },
                        { l: 'Steps',    v: res.section_scores.steps,           m: 20 },
                        { l: 'Exp/Act',  v: res.section_scores.expected_actual, m: 15 },
                        { l: 'Env',      v: res.section_scores.environment,     m: 15 },
                        { l: 'Severity', v: res.section_scores.severity,        m: 5  },
                        { l: 'Attach',   v: res.section_scores.attachments,     m: 5  },
                      ].map(({ l, v, m }) => {
                        const pct = Math.round((v / m) * 100);
                        const c = scoreColor(pct);
                        return (
                          <div key={l} style={{ background: '#fffefb', borderRadius: 8, padding: '.5rem .65rem', border: '1px solid #d4cfc5' }}>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '.85rem', color: c }}>{v}<span style={{ fontSize: '.6rem', color: '#a09a92' }}>/{m}</span></div>
                            <div style={{ fontSize: '.6rem', color: '#7a756e', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: "'DM Mono', monospace", margin: '.15rem 0 .3rem' }}>{l}</div>
                            <div style={{ height: 3, background: '#e8e2d8', borderRadius: 4 }}>
                              <div style={{ height: 3, width: `${pct}%`, background: c, borderRadius: 4 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Alerts */}
                    {res.missing_alerts.length > 0 && (
                      <div style={{ marginBottom: '.7rem' }}>
                        <div style={{ fontSize: '.7rem', color: '#a09a92', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Missing / Weak Fields</div>
                        {res.missing_alerts.slice(0, 4).map((a, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', marginBottom: '.28rem' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.severity === 'critical' ? '#c4410c' : '#b5830a', marginTop: 5, flexShrink: 0 }} />
                            <div style={{ fontSize: '.75rem', color: '#4a4540' }}><strong>{a.field}</strong> — {a.message}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
                      <button
                        onClick={() => setJiraModal({ result: res, title: issue.fields.summary })}
                        style={{
                          padding: '.42rem .9rem', background: '#1868DB', color: '#fff',
                          border: 'none', borderRadius: 8, cursor: 'pointer',
                          fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '.78rem',
                          display: 'inline-flex', alignItems: 'center', gap: '.35rem', transition: 'background .15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1050a0')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#1868DB')}
                      >
                        📋 Push quality report to Jira
                      </button>
                      <div className="bl-mono" style={{ fontSize: '.73rem', color: '#a09a92', alignSelf: 'center' }}>
                        Risk: {res.risk_level} · Effort: {res.estimated_fix_effort}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Guidance when no issues loaded */}
      {issues.length === 0 && !loadingIssues && conn?.connected && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#a09a92' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.7rem' }}>📋</div>
          <div className="bl-serif" style={{ fontSize: '1.1rem', color: '#7a756e', marginBottom: '.4rem' }}>Select a project and click Load Issues</div>
          <div className="bl-mono" style={{ fontSize: '.77rem' }}>BugLens will score each issue and highlight what's missing</div>
        </div>
      )}

      {/* Jira create modal */}
      {jiraModal && (
        <JiraCreateModal
          result={jiraModal.result}
          title={jiraModal.title}
          onClose={() => setJiraModal(null)}
        />
      )}
    </div>
  );
}
