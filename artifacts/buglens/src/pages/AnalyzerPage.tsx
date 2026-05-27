import { useState, useEffect } from 'react';
import { ResultsPanel } from './ResultsPanel';
import { computeLiveScore, ruleBasedAnalysis, aiAnalysis, scoreColor, gradeMeta } from '../lib/analysis';
import { getRandomSample } from '../lib/samples';
import { useToastTrigger } from '../components/Toast';
import type { AnalysisResult, HistoryItem, User } from '../lib/types';

interface Props {
  user: User;
  onAddHistory: (item: HistoryItem) => void;
  onShareToTeam?: (item: HistoryItem) => boolean;
  apiKey?: string;
}

function getInlineHint(field: string, value: string, value2?: string): { score: number; max: number; tip: string; color: string } | null {
  if (field === 'title') {
    const len = value.length;
    if (len === 0) return null;
    if (len <= 8)  return { score: 4,  max: 20, color: '#c4410c', tip: 'Try: "[Component] [Action] [Failure]" — e.g. "Login button fails on Safari 17"' };
    if (len <= 20) return { score: 8,  max: 20, color: '#b5830a', tip: 'Add the component name and specific behavior observed' };
    if (len <= 35) return { score: 13, max: 20, color: '#b5830a', tip: 'Getting better! Include browser/version for more points' };
    if (len <= 60) return { score: 17, max: 20, color: '#1d6b4e', tip: 'Almost there — add platform or version detail for full marks' };
    return { score: 20, max: 20, color: '#1d6b4e', tip: '✓ Excellent title' };
  }
  if (field === 'desc') {
    const len = value.length;
    if (len === 0) return null;
    if (len <= 20)  return { score: 4,  max: 20, color: '#c4410c', tip: 'Explain what is broken and its impact on users' };
    if (len <= 80)  return { score: 8,  max: 20, color: '#b5830a', tip: 'Add frequency (every time?), affected users, and failure pattern' };
    if (len <= 150) return { score: 13, max: 20, color: '#b5830a', tip: 'Good! Mention if this is a regression and when it started' };
    if (len <= 300) return { score: 17, max: 20, color: '#1d6b4e', tip: 'Very detailed — expand with affected scope for full marks' };
    return { score: 20, max: 20, color: '#1d6b4e', tip: '✓ Thorough description' };
  }
  if (field === 'steps') {
    const len = value.length;
    const lines = (value.match(/\n/g) || []).length;
    if (len === 0) return null;
    if (len <= 15) return { score: 4, max: 20, color: '#c4410c', tip: 'Number each step: "1. Go to login 2. Enter credentials 3. Click..."' };
    if (len > 100 && lines >= 4) return { score: 20, max: 20, color: '#1d6b4e', tip: '✓ Detailed numbered steps' };
    if (len > 60 && lines >= 2)  return { score: 17, max: 20, color: '#1d6b4e', tip: 'Good! Add 4+ numbered steps with preconditions for full marks' };
    if (len > 30 && lines >= 1)  return { score: 13, max: 20, color: '#b5830a', tip: 'Add more numbered steps — aim for 4+ clear lines' };
    return { score: 8, max: 20, color: '#b5830a', tip: 'Break steps onto separate lines with numbers (1. 2. 3.)' };
  }
  if (field === 'env') {
    const len = value.length;
    if (len === 0) return null;
    if (len <= 10) return { score: 4,  max: 15, color: '#c4410c', tip: 'Add OS, browser name/version, and app version' };
    if (len <= 25) return { score: 8,  max: 15, color: '#b5830a', tip: 'Include environment (staging/prod) and app version' };
    if (len <= 50) return { score: 12, max: 15, color: '#1d6b4e', tip: 'Add build number for full marks' };
    return { score: 15, max: 15, color: '#1d6b4e', tip: '✓ Complete environment details' };
  }
  if (field === 'exp_act') {
    const expLen = value.trim().length;
    const actLen = (value2 ?? '').trim().length;
    if (expLen === 0 && actLen === 0) return null;
    if (expLen > 20 && actLen > 20) return { score: 15, max: 15, color: '#1d6b4e', tip: '✓ Both results clearly described' };
    if (expLen > 0 && actLen > 0)   return { score: 11, max: 15, color: '#b5830a', tip: 'Expand both fields with more detail for full marks' };
    if (expLen > 20 || actLen > 20) return { score: 7,  max: 15, color: '#b5830a', tip: 'Fill in the missing result field (expected or actual)' };
    return { score: 4, max: 15, color: '#c4410c', tip: 'Both Expected and Actual results are needed' };
  }
  return null;
}

function InlineHint({ hint }: { hint: { score: number; max: number; tip: string; color: string } | null }) {
  if (!hint) return null;
  const pct = Math.round((hint.score / hint.max) * 100);
  return (
    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
      <div style={{ width: 60, height: 3, background: '#e8e3db', borderRadius: 2, flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: hint.color, borderRadius: 2, transition: 'width .3s ease' }} />
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.65rem', color: hint.color, fontWeight: 600 }}>
        {hint.score}/{hint.max}
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.65rem', color: '#7a756e' }}>
        {hint.tip}
      </span>
    </div>
  );
}

export function AnalyzerPage({ user, onAddHistory, onShareToTeam, apiKey }: Props) {
  const toast = useToastTrigger();

  const [fields, setFields] = useState({
    title: '', desc: '', steps: '', exp: '', act: '',
    env: '', sev: '', pri: '', comp: '', rep: '', exc: '', att: '',
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentHistItem, setCurrentHistItem] = useState<HistoryItem | null>(null);
  const [error, setError] = useState('');
  const [liveScore, setLiveScore] = useState(0);
  const [showLiveBar, setShowLiveBar] = useState(false);

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFields(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const s = computeLiveScore(fields.title, fields.desc, fields.steps, fields.exp, fields.act, fields.env, fields.sev);
    setLiveScore(s);
    setShowLiveBar(!!(fields.title || fields.desc));
  }, [fields]);

  const liveTags = () => {
    const tags: Array<{ cls: string; label: string }> = [];
    if (!fields.title) tags.push({ cls: 'bl-tag-red', label: 'No title' });
    else if (fields.title.length < 15) tags.push({ cls: 'bl-tag-amber', label: 'Short title' });
    else tags.push({ cls: 'bl-tag-green', label: 'Title ✓' });

    if (!fields.desc) tags.push({ cls: 'bl-tag-red', label: 'No description' });
    else tags.push({ cls: 'bl-tag-green', label: 'Description ✓' });

    if (!fields.steps) tags.push({ cls: 'bl-tag-red', label: 'No steps' });
    else if (!fields.steps.includes('\n')) tags.push({ cls: 'bl-tag-amber', label: 'Unnumbered steps' });
    else tags.push({ cls: 'bl-tag-green', label: 'Steps ✓' });

    if (!fields.sev) tags.push({ cls: 'bl-tag-amber', label: 'No severity' });
    else tags.push({ cls: 'bl-tag-green', label: 'Severity ✓' });

    if (!fields.env) tags.push({ cls: 'bl-tag-amber', label: 'No environment' });
    else tags.push({ cls: 'bl-tag-green', label: 'Env ✓' });
    return tags;
  };

  const handleAnalyze = async () => {
    setError('');
    setAnalyzing(true);
    setResult(null);

    try {
      let parsed: AnalysisResult;
      if (apiKey) {
        parsed = await aiAnalysis(fields, apiKey);
      } else {
        await new Promise(r => setTimeout(r, 800));
        parsed = ruleBasedAnalysis(fields);
      }

      setResult(parsed);
      const histItem: HistoryItem = {
        id: Date.now(),
        timestamp: Date.now(),
        title: fields.title,
        score: parsed.overall_score,
        grade: gradeMeta(parsed.overall_score).label,
        parsed,
        fields,
      };
      setCurrentHistItem(histItem);
      onAddHistory(histItem);
      toast(`✓ Analysis complete — score: ${parsed.overall_score}/100`);
    } catch (e) {
      setError(`⚠ ${e instanceof Error ? e.message : 'Analysis failed. Please try again.'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setFields({ title: '', desc: '', steps: '', exp: '', act: '', env: '', sev: '', pri: '', comp: '', rep: '', exc: '', att: '' });
    setResult(null); setError(''); setShowLiveBar(false);
  };

  const handleSample = () => {
    const sample = getRandomSample();
    setFields(sample);
    toast('📄 Sample loaded');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename; a.click();
  };

  const safeFilename = (s: string) => s.replace(/\s+/g, '_').slice(0, 40);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.8rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Defect Quality Checker</h1>
          <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>// AI analysis · exception detection · downloadable reports</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="bl-btn-secondary" onClick={handleSample} data-testid="button-load-sample">📄 Load Sample</button>
          <button className="bl-btn-secondary" onClick={handleClear}  data-testid="button-clear">✕ Clear</button>
        </div>
      </div>

      {/* Report Identity */}
      <div className="bl-card">
        <div className="bl-card-title">📋 Report Identity</div>
        <div className="bl-field">
          <label className="bl-label">Bug Title <span style={{ color: '#c4410c' }}>*</span></label>
          <input className="bl-input" data-testid="input-title" value={fields.title} onChange={set('title')} placeholder="e.g. Login button unresponsive on Safari 17 with 2FA enabled" />
          <div className="bl-mono" style={{ fontSize: '.67rem', color: fields.title.length > 20 ? '#1d6b4e' : fields.title.length > 0 ? '#b5830a' : '#a09a92', textAlign: 'right', marginTop: 2 }}>{fields.title.length} chars</div>
        </div>
        <div className="bl-field">
          <label className="bl-label">Description <span style={{ color: '#c4410c' }}>*</span></label>
          <textarea className="bl-textarea" data-testid="input-desc" rows={3} value={fields.desc} onChange={set('desc')} placeholder="What is broken? What is the user impact? Any frequency or pattern?" />
          <div className="bl-mono" style={{ fontSize: '.67rem', color: fields.desc.length > 20 ? '#1d6b4e' : fields.desc.length > 0 ? '#b5830a' : '#a09a92', textAlign: 'right', marginTop: 2 }}>{fields.desc.length} chars</div>
        </div>
      </div>

      {/* Steps & Outcome */}
      <div className="bl-card">
        <div className="bl-card-title">🔁 Steps & Outcome</div>
        <div className="bl-field">
          <label className="bl-label">Steps to Reproduce <span style={{ color: '#c4410c' }}>*</span></label>
          <textarea className="bl-textarea" data-testid="input-steps" rows={4} value={fields.steps} onChange={set('steps')}
            placeholder={'1. Go to the login page\n2. Enter valid credentials\n3. Click Sign In\n4. Observe...'} />
          <div className="bl-mono" style={{ fontSize: '.67rem', color: fields.steps.length > 20 ? '#1d6b4e' : fields.steps.length > 0 ? '#b5830a' : '#a09a92', textAlign: 'right', marginTop: 2 }}>{fields.steps.length} chars</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
          <div className="bl-field" style={{ marginBottom: 0 }}>
            <label className="bl-label">Expected Result <span style={{ color: '#c4410c' }}>*</span></label>
            <textarea className="bl-textarea" data-testid="input-expected" rows={2} value={fields.exp} onChange={set('exp')} placeholder="User is authenticated and redirected." />
          </div>
          <div className="bl-field" style={{ marginBottom: 0 }}>
            <label className="bl-label">Actual Result <span style={{ color: '#c4410c' }}>*</span></label>
            <textarea className="bl-textarea" data-testid="input-actual" rows={2} value={fields.act} onChange={set('act')} placeholder="Button unresponsive. No error shown." />
          </div>
        </div>
      </div>

      {/* Context & Classification */}
      <div className="bl-card">
        <div className="bl-card-title">⚙️ Context & Classification</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.85rem' }}>
          <div className="bl-field" style={{ marginBottom: 0 }}>
            <label className="bl-label">Environment <span style={{ color: '#a09a92', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '.7rem' }}>(recommended)</span></label>
            <textarea className="bl-textarea" data-testid="input-env" rows={2} value={fields.env} onChange={set('env')} placeholder="macOS 14, Safari 17, App v2.4, Staging" />
          </div>
          <div className="bl-field" style={{ marginBottom: 0 }}>
            <label className="bl-label">Severity</label>
            <select className="bl-select" data-testid="select-severity" value={fields.sev} onChange={set('sev')}>
              <option value="">— Select —</option>
              <option value="Critical">🔴 Critical</option>
              <option value="High">🟠 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
              <option value="Trivial">⚪ Trivial</option>
            </select>
            <div style={{ marginTop: '.55rem' }}>
              <label className="bl-label">Priority</label>
              <select className="bl-select" data-testid="select-priority" value={fields.pri} onChange={set('pri')}>
                <option value="">— Select —</option>
                <option value="P1">P1 — Immediate</option>
                <option value="P2">P2 — High</option>
                <option value="P3">P3 — Medium</option>
                <option value="P4">P4 — Low</option>
              </select>
            </div>
          </div>
          <div className="bl-field" style={{ marginBottom: 0 }}>
            <label className="bl-label">Component</label>
            <input className="bl-input" data-testid="input-component" value={fields.comp} onChange={set('comp')} placeholder="e.g. Auth, Checkout" />
            <div style={{ marginTop: '.55rem' }}>
              <label className="bl-label">Reporter</label>
              <input className="bl-input" data-testid="input-reporter" value={fields.rep} onChange={set('rep')} placeholder="e.g. QA Team" />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem', marginTop: '.85rem' }}>
          <div className="bl-field" style={{ marginBottom: 0 }}>
            <label className="bl-label">Exception / Stack Trace <span style={{ color: '#a09a92', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '.7rem' }}>(paste error)</span></label>
            <textarea className="bl-textarea" data-testid="input-exception" rows={3} value={fields.exc} onChange={set('exc')} placeholder={'TypeError: Cannot read...\n  at login.js:42'} />
          </div>
          <div className="bl-field" style={{ marginBottom: 0 }}>
            <label className="bl-label">Attachments / Logs <span style={{ color: '#a09a92', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '.7rem' }}>(optional)</span></label>
            <textarea className="bl-textarea" data-testid="input-attachments" rows={3} value={fields.att} onChange={set('att')} placeholder={'Screenshot URL\nConsole log link\nVideo / HAR link'} />
          </div>
        </div>
      </div>

      {/* Live Completeness Bar */}
      {showLiveBar && (
        <div className="bl-livebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.45rem' }}>
            <span className="bl-mono" style={{ fontSize: '.7rem', color: '#a09a92', textTransform: 'uppercase', letterSpacing: '.08em' }}>Live Completeness</span>
            <span className="bl-mono" style={{ fontSize: '.95rem', fontWeight: 700, color: scoreColor(liveScore) }}>{liveScore}%</span>
          </div>
          <div className="bl-livebar-track">
            <div className="bl-livebar-fill" style={{ width: `${liveScore}%`, background: scoreColor(liveScore) }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginTop: '.5rem' }}>
            {liveTags().map((t, i) => (
              <span key={i} className={`bl-tag ${t.cls}`}>{t.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginTop: '1.1rem', flexWrap: 'wrap' }}>
        <button
          className="bl-btn-primary"
          onClick={handleAnalyze}
          disabled={analyzing}
          data-testid="button-analyze"
          style={{ background: analyzing ? '#a33008' : '#c4410c' }}
          onMouseEnter={e => { if (!analyzing) (e.currentTarget as HTMLButtonElement).style.background = '#a33008'; }}
          onMouseLeave={e => { if (!analyzing) (e.currentTarget as HTMLButtonElement).style.background = '#c4410c'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {analyzing ? 'Analyzing...' : 'Analyze Report'}
        </button>
        {!apiKey && (
          <span className="bl-mono" style={{ fontSize: '.72rem', color: '#a09a92' }}>// Rule-based analysis · Add Anthropic API key for AI analysis</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2ee', border: '1px solid #f8c4b0', color: '#c4410c', fontSize: '.82rem', padding: '.75rem 1rem', borderRadius: 10, fontFamily: "'DM Mono', monospace", marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {/* Analyzing spinner */}
      {analyzing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', color: '#7a756e', fontFamily: "'DM Mono', monospace", fontSize: '.82rem', padding: '1.4rem', background: '#fffefb', border: '1px solid #d4cfc5', borderRadius: 16, marginTop: '1rem' }}>
          <div className="bl-spin" />
          <span>Running AI analysis, detecting exceptions, building report...</span>
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div style={{ marginTop: '1.1rem' }}>
          <ResultsPanel
            result={result}
            title={fields.title}
            excRaw={fields.exc}
            onDownloadTXT={() => {
              downloadFile(result.rewritten_report, `${safeFilename(fields.title)}_report.txt`, 'text/plain');
              toast('⬇ Downloaded TXT');
            }}
            onDownloadMD={() => {
              const gm = gradeMeta(result.overall_score);
              const md = `# Bug Report: ${fields.title}\n\n**Score:** ${result.overall_score}/100  **Grade:** ${gm.label}\n\n---\n\n${result.rewritten_report}`;
              downloadFile(md, `${safeFilename(fields.title)}_report.md`, 'text/markdown');
              toast('⬇ Downloaded MD');
            }}
            onDownloadHTML={() => {
              const gm = gradeMeta(result.overall_score);
              const c = scoreColor(result.overall_score);
              const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Bug Report</title><style>body{font-family:Georgia,serif;max-width:740px;margin:2rem auto;padding:1.5rem;color:#1a1714;background:#f5f2ee}h1{font-size:1.5rem;margin-bottom:.5rem}.meta{font-family:monospace;font-size:.78rem;color:#7a756e;margin-bottom:1.4rem;padding-bottom:.9rem;border-bottom:1px solid #d4cfc5}.chip{display:inline-block;padding:.28rem .85rem;border-radius:20px;font-family:monospace;font-weight:700;color:${c};background:#f5f2ee;border:2px solid ${c};margin-right:.45rem}.grade{display:inline-block;padding:.22rem .75rem;border-radius:12px;font-family:monospace;font-size:.78rem;font-weight:600;background:${gm.bg};color:${gm.color}}pre{background:#f0ede7;border:1px solid #d4cfc5;border-radius:8px;padding:1.1rem;font-family:monospace;font-size:.8rem;line-height:1.8;white-space:pre-wrap;margin-top:1.1rem}.foot{margin-top:1.8rem;padding-top:.9rem;border-top:1px solid #d4cfc5;font-size:.72rem;color:#a09a92;font-family:monospace}</style></head><body><h1>Bug Report</h1><div class="meta">Generated by BugLens · ${new Date().toLocaleString()} · ${user.name}</div><span class="chip">${result.overall_score}/100</span><span class="grade">${gm.label}</span><pre>${result.rewritten_report.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><div class="foot">BugLens Defect Quality Checker</div></body></html>`;
              downloadFile(html, `${safeFilename(fields.title)}_report.html`, 'text/html');
              toast('⬇ Downloaded HTML');
            }}
            onDownloadJSON={() => {
              const gm = gradeMeta(result.overall_score);
              const out = { meta: { generated: new Date().toISOString(), analyst: user.name, tool: 'BugLens' }, title: fields.title, score: result.overall_score, grade: gm.label, ...result };
              downloadFile(JSON.stringify(out, null, 2), `${safeFilename(fields.title)}_analysis.json`, 'application/json');
              toast('⬇ Downloaded JSON');
            }}
          />
        </div>
      )}
    </div>
  );
}
