import { scoreColor, gradeMeta, parseException } from '../lib/analysis';
import { SECTION_META } from '../lib/types';
import type { AnalysisResult } from '../lib/types';
import { ScoreRing } from '../components/ScoreRing';
import { useToastTrigger } from '../components/Toast';

interface Props {
  result: AnalysisResult;
  title: string;
  excRaw: string;
  onDownloadTXT: () => void;
  onDownloadMD: () => void;
  onDownloadHTML: () => void;
  onDownloadJSON: () => void;
  onShareToTeam?: () => void;
}

export function ResultsPanel({ result, title, excRaw, onDownloadTXT, onDownloadMD, onDownloadHTML, onDownloadJSON, onShareToTeam }: Props) {
  const toast = useToastTrigger();
  const { overall_score, section_scores, missing_alerts, suggestions, exception_analysis, risk_level, estimated_fix_effort, recommended_assignee, test_case_hint, rewritten_report } = result;
  const col = scoreColor(overall_score);
  const gm = gradeMeta(overall_score);
  const localExc = parseException(excRaw);

  const tagline =
    overall_score >= 90 ? 'Excellent — ready for development' :
    overall_score >= 75 ? 'Good with minor gaps' :
    overall_score >= 55 ? 'Needs improvement before filing' :
    'Incomplete — key info missing';

  const riskCls = risk_level === 'High' ? 'bl-tag-red' : risk_level === 'Medium' ? 'bl-tag-amber' : 'bl-tag-green';

  const handleCopyRewrite = () => {
    navigator.clipboard.writeText(rewritten_report || '').then(() => toast('✓ Copied'));
  };

  return (
    <div className="bl-result-enter">
      {/* Score Panel */}
      <div className="bl-score-panel">
        <ScoreRing score={overall_score} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'inline-block', padding: '.22rem .85rem', borderRadius: 20, fontSize: '.76rem', fontWeight: 600, fontFamily: "'DM Mono', monospace", background: gm.bg, color: gm.color, marginBottom: '.45rem' }}>
            {gm.label}
          </div>
          <div className="bl-serif" style={{ fontSize: '1.2rem', color: '#1a1714', marginBottom: '.25rem' }}>{tagline}</div>
          <div style={{ fontSize: '.8rem', color: '#7a756e', marginBottom: '.5rem' }}>{title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '.55rem' }}>
            <span className={`bl-tag ${riskCls}`}>Risk: {risk_level}</span>
            <span className="bl-tag bl-tag-blue">Effort: {estimated_fix_effort}</span>
            <span className="bl-tag bl-tag-blue">→ {recommended_assignee}</span>
          </div>
          <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
            <button className="bl-btn-secondary" onClick={onDownloadTXT} data-testid="button-dl-txt" style={{ fontSize: '.78rem', padding: '.45rem .8rem' }}>⬇ TXT</button>
            <button className="bl-btn-secondary" onClick={onDownloadMD}  data-testid="button-dl-md"  style={{ fontSize: '.78rem', padding: '.45rem .8rem' }}>⬇ MD</button>
            <button className="bl-btn-secondary" onClick={onDownloadHTML}data-testid="button-dl-html"style={{ fontSize: '.78rem', padding: '.45rem .8rem' }}>⬇ HTML</button>
            <button className="bl-btn-green"     onClick={onDownloadJSON}data-testid="button-dl-json"style={{ fontSize: '.78rem', padding: '.45rem .8rem' }}>⬇ JSON</button>
            {onShareToTeam && (
              <button
                onClick={onShareToTeam}
                data-testid="button-share-team"
                style={{ fontSize: '.78rem', padding: '.45rem .9rem', background: '#1e4b8a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '.35rem', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#163870')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1e4b8a')}
              >👥 Share to Team</button>
            )}
          </div>
        </div>
      </div>

      {/* Section Scores */}
      <div className="bl-sscores">
        {(Object.keys(SECTION_META) as (keyof typeof SECTION_META)[]).map(k => {
          const val = section_scores[k] ?? 0;
          const max = SECTION_META[k].m;
          const pct = Math.round((val / max) * 100);
          const c = scoreColor(pct);
          return (
            <div className="bl-ssc" key={k} data-testid={`score-${k}`}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: c }}>
                {val}<span style={{ fontSize: '.68rem', color: '#a09a92' }}>/{max}</span>
              </div>
              <div style={{ fontSize: '.63rem', color: '#7a756e', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: "'DM Mono', monospace", margin: '.18rem 0 .35rem' }}>
                {SECTION_META[k].l}
              </div>
              <div className="bl-ssc-bar">
                <div className="bl-ssc-fill" style={{ width: `${pct}%`, background: c }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Exception Analysis */}
      {excRaw && localExc.length > 0 && (
        <div className="bl-result-card">
          <div className="bl-result-card-title">🔍 Exception Analysis</div>
          <div className="bl-exc-grid">
            {localExc.map((e, i) => (
              <div key={i} className={`bl-exc-card ${e.sev}`} data-testid={`exc-card-${i}`}>
                <div className="bl-exc-type">{e.sev} · {e.type}</div>
                <div style={{ fontSize: '.83rem', fontWeight: 600, color: '#1a1714', marginBottom: '.18rem' }}>{e.type} detected</div>
                <div style={{ fontSize: '.77rem', color: '#7a756e', lineHeight: 1.5 }}>{e.hint}</div>
              </div>
            ))}
          </div>
          {exception_analysis && exception_analysis !== 'No exception provided.' && (
            <div style={{ marginTop: '.7rem', background: '#f5f2ee', border: '1px solid #d4cfc5', borderRadius: 10, padding: '.85rem', fontSize: '.82rem', lineHeight: 1.7, color: '#4a4540', fontFamily: "'DM Mono', monospace" }}>
              {exception_analysis}
            </div>
          )}
        </div>
      )}

      {/* Test Case Hint */}
      {test_case_hint && (
        <div className="bl-result-card">
          <div className="bl-result-card-title">🧪 Suggested Test Case</div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '.82rem', fontFamily: "'DM Mono', monospace", fontSize: '.8rem', color: '#1e4b8a', lineHeight: 1.7 }}>
            {test_case_hint}
          </div>
        </div>
      )}

      {/* Missing / Weak Fields */}
      {missing_alerts.length > 0 && (
        <div className="bl-result-card">
          <div className="bl-result-card-title">⚠ Missing / Weak Fields</div>
          {missing_alerts.map((a, i) => {
            const dotColor = a.severity === 'critical' ? '#c4410c' : a.severity === 'warning' ? '#b5830a' : '#7a756e';
            return (
              <div key={i} className="bl-alert-item" data-testid={`alert-${i}`}>
                <div className="bl-alert-dot" style={{ background: dotColor }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#1a1714' }}>{a.field}</div>
                  <div style={{ color: '#7a756e', marginTop: 2, fontSize: '.78rem' }}>{a.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Recommendations */}
      {suggestions.length > 0 && (
        <div className="bl-result-card">
          <div className="bl-result-card-title">💡 AI Recommendations</div>
          {suggestions.map((s, i) => (
            <div key={i} className="bl-suggestion" data-testid={`suggestion-${i}`}>{s}</div>
          ))}
        </div>
      )}

      {/* Rewritten Report */}
      <div className="bl-result-card">
        <div className="bl-result-card-title">
          ✍ Professional Rewrite
          <button className="bl-copy-btn" onClick={handleCopyRewrite} data-testid="button-copy-rewrite">Copy</button>
        </div>
        <div className="bl-rewrite-box" data-testid="rewrite-box">
          {rewritten_report}
        </div>
      </div>
    </div>
  );
}
