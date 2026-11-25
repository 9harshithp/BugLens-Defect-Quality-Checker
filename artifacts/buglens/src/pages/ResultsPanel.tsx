import { useState } from 'react';
import { scoreColor, gradeMeta, parseException } from '../lib/analysis';
import { DEFECT_CATEGORIES, SECTION_META } from '../lib/types';
import type { AnalysisResult, DefectCategory, DuplicateMatch } from '../lib/types';
import { ScoreRing } from '../components/ScoreRing';
import { useToastTrigger } from '../components/Toast';
import {
  Download,
  Search,
  FlaskConical,
  AlertTriangle,
  Lightbulb,
  PenLine,
  Tag,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  result: AnalysisResult;
  title: string;
  excRaw: string;
  duplicates?: DuplicateMatch[];
  onSelectDuplicate?: (item: DuplicateMatch['item']) => void;
  onUpdateCategory?: (cat: DefectCategory) => void;
  onUpdateRewrite?: (text: string) => void;
  onDownloadTXT: () => void;
  onDownloadMD: () => void;
  onDownloadHTML: () => void;
  onDownloadJSON: () => void;
  onDownloadPDF?: () => void;
}

export function ResultsPanel({
  result,
  title,
  excRaw,
  duplicates = [],
  onSelectDuplicate,
  onUpdateCategory,
  onUpdateRewrite,
  onDownloadTXT,
  onDownloadMD,
  onDownloadHTML,
  onDownloadJSON,
  onDownloadPDF,
}: Props) {
  const toast = useToastTrigger();
  const [activeTcTab, setActiveTcTab] = useState<'Positive' | 'Negative' | 'Boundary' | 'Regression'>('Positive');
  const [editingRewrite, setEditingRewrite] = useState(false);

  const {
    overall_score,
    section_scores,
    section_explanations,
    missing_alerts,
    suggestions,
    exception_analysis,
    exceptions,
    risk_level,
    estimated_fix_effort,
    recommended_assignee,
    suggested_severity,
    suggested_priority,
    defect_category,
    test_case_hint,
    test_cases,
    rewritten_report,
    analysis_mode,
    fallback_reason,
  } = result;

  const gm = gradeMeta(overall_score);
  const localExc = exceptions && exceptions.length > 0 ? exceptions : parseException(excRaw);

  const tagline =
    overall_score >= 90 ? 'Excellent — ready for development' :
    overall_score >= 75 ? 'Good with minor gaps' :
    overall_score >= 55 ? 'Needs improvement before filing' :
    'Incomplete — key info missing';

  const riskCls = risk_level === 'High' ? 'bl-tag-red' : risk_level === 'Medium' ? 'bl-tag-amber' : 'bl-tag-green';

  const handleCopyRewrite = () => {
    navigator.clipboard.writeText(rewritten_report || '').then(() => toast('Copied to clipboard'));
  };

  const activeTestCase = test_cases?.find(tc => tc.type === activeTcTab);

  return (
    <div className="bl-result-enter">
      {/* Score Panel */}
      <div className="bl-score-panel">
        <ScoreRing score={overall_score} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.45rem' }}>
            <div style={{ display: 'inline-block', padding: '.22rem .85rem', borderRadius: 20, fontSize: '.76rem', fontWeight: 600, fontFamily: "'DM Mono', monospace", background: gm.bg, color: gm.color }}>
              {gm.label}
            </div>
            <span
              className="bl-mono"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.25rem',
                padding: '.18rem .6rem', borderRadius: 12, fontSize: '.68rem',
                background: analysis_mode === 'ai' ? '#eff6ff' : '#f0ede7',
                color: analysis_mode === 'ai' ? '#1e4b8a' : '#7a756e',
              }}
              title={fallback_reason || undefined}
            >
              {analysis_mode === 'ai' ? <><Sparkles size={11} /> AI-Enhanced</> :
               analysis_mode === 'ai-fallback' ? 'Rule-Based (AI Fallback)' : 'Rule-Based (Deterministic)'}
            </span>
          </div>
          <div className="bl-serif" style={{ fontSize: '1.2rem', color: '#1a1714', marginBottom: '.25rem' }}>{tagline}</div>
          <div style={{ fontSize: '.8rem', color: '#7a756e', marginBottom: '.5rem' }}>{title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '.55rem', alignItems: 'center' }}>
            <span className={`bl-tag ${riskCls}`}>Risk: {risk_level}</span>
            <span className="bl-tag bl-tag-blue">Effort: {estimated_fix_effort}</span>
            <span className="bl-tag bl-tag-blue">Team: {recommended_assignee}</span>
            {suggested_severity && <span className="bl-tag bl-tag-amber">Sev: {suggested_severity}</span>}
            {suggested_priority && <span className="bl-tag bl-tag-amber">Pri: {suggested_priority}</span>}
          </div>

          {/* Editable Defect Classification */}
          {defect_category && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', marginBottom: '.65rem', flexWrap: 'wrap' }}>
              <span className="bl-mono" style={{ fontSize: '.72rem', color: '#7a756e', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
                <Tag size={12} /> Category:
              </span>
              {onUpdateCategory ? (
                <select
                  className="bl-select"
                  value={defect_category}
                  onChange={e => onUpdateCategory(e.target.value as DefectCategory)}
                  data-testid="select-defect-category"
                  style={{ width: 'auto', padding: '.2rem .55rem', fontSize: '.75rem', height: 'auto' }}
                >
                  {DEFECT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <span className="bl-tag bl-tag-blue">{defect_category}</span>
              )}
              {result.classification?.reason && (
                <span className="bl-mono" style={{ fontSize: '.68rem', color: '#a09a92' }}>
                  {result.classification.reason}
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
            <button className="bl-btn-secondary" onClick={onDownloadTXT} data-testid="button-dl-txt" style={{ fontSize: '.78rem', padding: '.45rem .8rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Download size={13} /> TXT</button>
            <button className="bl-btn-secondary" onClick={onDownloadMD}  data-testid="button-dl-md"  style={{ fontSize: '.78rem', padding: '.45rem .8rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Download size={13} /> MD</button>
            <button className="bl-btn-secondary" onClick={onDownloadHTML}data-testid="button-dl-html"style={{ fontSize: '.78rem', padding: '.45rem .8rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Download size={13} /> HTML</button>
            <button className="bl-btn-green"     onClick={onDownloadJSON}data-testid="button-dl-json"style={{ fontSize: '.78rem', padding: '.45rem .8rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Download size={13} /> JSON</button>
            {onDownloadPDF && (
              <button className="bl-btn-secondary" onClick={onDownloadPDF} data-testid="button-dl-pdf" style={{ fontSize: '.78rem', padding: '.45rem .8rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Download size={13} /> PDF</button>
            )}
          </div>
        </div>
      </div>

      {/* Potential Duplicates */}
      {duplicates.length > 0 && (
        <div className="bl-result-card" style={{ borderColor: '#f59e0b', background: '#fffdf7' }}>
          <div className="bl-result-card-title" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: '#b5830a' }}>
            <ShieldAlert size={15} /> Potential Duplicate Reports ({duplicates.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {duplicates.map(d => (
              <div key={d.item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', padding: '.55rem .75rem', background: '#fffefb', border: '1px solid #e8dec8', borderRadius: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '.84rem', fontWeight: 600, color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.item.title}
                  </div>
                  <div className="bl-mono" style={{ fontSize: '.7rem', color: '#7a756e', marginTop: 2 }}>
                    {d.similarity}% match · Matched on: {d.matchedOn.join(', ')} · Score: {d.item.score}/100
                  </div>
                </div>
                {onSelectDuplicate && (
                  <button className="bl-btn-sm" onClick={() => onSelectDuplicate(d.item)} data-testid={`button-view-dup-${d.item.id}`}>
                    Inspect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Scores with Explanations */}
      <div className="bl-sscores">
        {(Object.keys(SECTION_META) as (keyof typeof SECTION_META)[]).map(k => {
          const val = section_scores[k] ?? 0;
          const max = SECTION_META[k].m;
          const pct = Math.round((val / max) * 100);
          const c = scoreColor(pct);
          const exp = section_explanations?.[k];
          return (
            <div className="bl-ssc" key={k} data-testid={`score-${k}`} title={exp}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: c }}>
                {val}<span style={{ fontSize: '.68rem', color: '#a09a92' }}>/{max}</span>
              </div>
              <div style={{ fontSize: '.63rem', color: '#7a756e', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: "'DM Mono', monospace", margin: '.18rem 0 .35rem' }}>
                {SECTION_META[k].l}
              </div>
              <div className="bl-ssc-bar">
                <div className="bl-ssc-fill" style={{ width: `${pct}%`, background: c }} />
              </div>
              {exp && (
                <div style={{ fontSize: '.65rem', color: '#7a756e', marginTop: '.35rem', lineHeight: 1.35 }}>
                  {exp.replace(/^\d+\/\d+:\s*/, '')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Exception Analysis */}
      {excRaw && localExc.length > 0 && (
        <div className="bl-result-card">
          <div className="bl-result-card-title" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Search size={15} /> Exception &amp; Error Analysis</div>
          <div className="bl-exc-grid">
            {localExc.map((e, i) => (
              <div key={i} className={`bl-exc-card ${e.sev}`} data-testid={`exc-card-${i}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.4rem', marginBottom: '.2rem' }}>
                  <span className="bl-exc-type">{e.sev} · {e.type}</span>
                  <span className="bl-mono" style={{ fontSize: '.65rem', color: '#7a756e' }}>
                    {e.confidence} confidence · {e.recommended_team}
                  </span>
                </div>
                <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#1a1714', marginBottom: '.2rem' }}>
                  {e.category}
                </div>
                {e.context && (
                  <div className="bl-mono" style={{ fontSize: '.7rem', color: '#4a4540', background: '#f5f2ee', padding: '.3rem .45rem', borderRadius: 6, marginBottom: '.35rem', overflowX: 'auto' }}>
                    {e.context}
                  </div>
                )}
                <div style={{ fontSize: '.77rem', color: '#4a4540', lineHeight: 1.5, marginBottom: '.35rem' }}>{e.hypothesis}</div>
                {e.diagnostic_questions?.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '.73rem', color: '#7a756e', lineHeight: 1.45 }}>
                    {e.diagnostic_questions.map((q, qi) => <li key={qi}>{q}</li>)}
                  </ul>
                )}
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

      {/* BDD Test Cases */}
      {(test_cases?.length || test_case_hint) && (
        <div className="bl-result-card">
          <div className="bl-result-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><FlaskConical size={15} /> BDD Test Cases</span>
            {test_cases && test_cases.length > 0 && (
              <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                {(['Positive', 'Negative', 'Boundary', 'Regression'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTcTab(t)}
                    className="bl-btn-sm"
                    style={{
                      background: activeTcTab === t ? '#1a1714' : '#f0ede7',
                      color: activeTcTab === t ? '#fff' : '#4a4540',
                      borderColor: activeTcTab === t ? '#1a1714' : '#d4cfc5',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '.82rem', fontFamily: "'DM Mono', monospace", fontSize: '.78rem', color: '#1e4b8a', lineHeight: 1.7 }}>
            {activeTestCase ? activeTestCase.gherkin : test_case_hint}
          </pre>
        </div>
      )}

      {/* Missing / Weak Fields */}
      {missing_alerts.length > 0 && (
        <div className="bl-result-card">
          <div className="bl-result-card-title" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><AlertTriangle size={15} /> Missing / Weak Fields</div>
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

      {/* Recommendations */}
      {suggestions.length > 0 && (
        <div className="bl-result-card">
          <div className="bl-result-card-title" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Lightbulb size={15} /> Recommendations</div>
          {suggestions.map((s, i) => (
            <div key={i} className="bl-suggestion" data-testid={`suggestion-${i}`}>{s}</div>
          ))}
        </div>
      )}

      {/* Rewritten Report (Editable before export) */}
      <div className="bl-result-card">
        <div className="bl-result-card-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><PenLine size={15} /> Professional Defect Report</span>
          <div style={{ display: 'flex', gap: '.35rem' }}>
            {onUpdateRewrite && (
              <button
                className="bl-copy-btn"
                onClick={() => setEditingRewrite(e => !e)}
                data-testid="button-edit-rewrite"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}
              >
                {editingRewrite ? <><Check size={12} /> Done</> : <><PenLine size={12} /> Edit</>}
              </button>
            )}
            <button
              className="bl-copy-btn"
              onClick={handleCopyRewrite}
              data-testid="button-copy-rewrite"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}
            >
              <Copy size={12} /> Copy
            </button>
          </div>
        </div>
        {editingRewrite && onUpdateRewrite ? (
          <textarea
            className="bl-textarea"
            rows={16}
            value={rewritten_report}
            onChange={e => onUpdateRewrite(e.target.value)}
            data-testid="textarea-edit-rewrite"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: '.78rem', lineHeight: 1.7 }}
          />
        ) : (
          <div className="bl-rewrite-box" data-testid="rewrite-box">
            {rewritten_report}
          </div>
        )}
      </div>
    </div>
  );
}
