import { useState } from 'react';
import { scoreColor, gradeMeta, timeAgo } from '../lib/analysis';
import { SECTION_META } from '../lib/types';
import { useToastTrigger } from '../components/Toast';
import { ScoreRing } from '../components/ScoreRing';
import type { HistoryItem } from '../lib/types';

interface Props {
  history: HistoryItem[];
}

export function ComparePage({ history }: Props) {
  const toast = useToastTrigger();
  const [selA, setSelA] = useState<string>(history[0]?.id?.toString() || '');
  const [selB, setSelB] = useState<string>(history[1]?.id?.toString() || '');
  const [compared, setCompared] = useState(false);

  const doCompare = () => {
    if (selA === selB) { toast('Select two different reports'); return; }
    setCompared(true);
  };

  const A = history.find(h => h.id.toString() === selA);
  const B = history.find(h => h.id.toString() === selB);

  const winner = A && B ? (A.score >= B.score ? 'A' : 'B') : null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.8rem' }}>
        <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Compare Reports</h1>
        <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>// Side-by-side quality analysis</p>
      </div>

      {history.length < 2 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fffefb', border: '1px solid #d4cfc5', borderRadius: 16, color: '#a09a92', fontFamily: "'DM Mono', monospace", fontSize: '.84rem' }}>
          You need at least 2 analyses in history to compare.
        </div>
      ) : (
        <>
          <div className="bl-card">
            <div className="bl-card-title">Select Two Reports</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
              <div className="bl-field" style={{ marginBottom: 0 }}>
                <label className="bl-label">Report A</label>
                <select className="bl-select" data-testid="select-report-a" value={selA} onChange={e => { setSelA(e.target.value); setCompared(false); }}>
                  {history.map(h => (
                    <option key={h.id} value={h.id.toString()}>
                      {h.title.slice(0, 48)} ({h.score}/100)
                    </option>
                  ))}
                </select>
              </div>
              <div className="bl-field" style={{ marginBottom: 0 }}>
                <label className="bl-label">Report B</label>
                <select className="bl-select" data-testid="select-report-b" value={selB} onChange={e => { setSelB(e.target.value); setCompared(false); }}>
                  {history.map(h => (
                    <option key={h.id} value={h.id.toString()}>
                      {h.title.slice(0, 48)} ({h.score}/100)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginTop: '1.1rem' }}>
              <button className="bl-btn-primary" onClick={doCompare} data-testid="button-compare">
                ⚡ Compare
              </button>
            </div>
          </div>

          {compared && A && B && (
            <div className="bl-result-enter">
              {/* Side-by-side panels */}
              <div className="bl-compare-grid">
                {[{ report: A, label: 'A', isWinner: winner === 'A' }, { report: B, label: 'B', isWinner: winner === 'B' }].map(({ report, label, isWinner }) => {
                  const col = scoreColor(report.score);
                  const gm = gradeMeta(report.score);
                  return (
                    <div className="bl-compare-panel" key={label} data-testid={`compare-panel-${label}`}>
                      <h4 className="bl-mono" style={{ fontSize: '.7rem', color: '#a09a92', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.7rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        Report {label}
                        {isWinner && <span style={{ display: 'inline-block', padding: '.18rem .6rem', borderRadius: 4, fontSize: '.67rem', fontFamily: "'DM Mono', monospace", fontWeight: 600, background: '#e8f5f0', color: '#1d6b4e' }}>Winner ✓</span>}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.6rem' }}>
                        <ScoreRing score={report.score} size={72} />
                        <div>
                          <div style={{ display: 'inline-block', padding: '.22rem .75rem', borderRadius: 12, fontSize: '.7rem', fontFamily: "'DM Mono', monospace", fontWeight: 600, background: gm.bg, color: gm.color, marginBottom: '.28rem' }}>{gm.label}</div>
                          <div style={{ fontSize: '.84rem', fontWeight: 600, color: '#1a1714', marginBottom: '.25rem' }}>{report.title.slice(0, 50)}</div>
                          <div className="bl-mono" style={{ fontSize: '.73rem', color: '#a09a92' }}>{timeAgo(report.timestamp)}</div>
                        </div>
                      </div>
                      {report.parsed?.risk_level && (
                        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
                          <span className={`bl-tag ${report.parsed.risk_level === 'High' ? 'bl-tag-red' : report.parsed.risk_level === 'Medium' ? 'bl-tag-amber' : 'bl-tag-green'}`}>Risk: {report.parsed.risk_level}</span>
                          {report.parsed.recommended_assignee && <span className="bl-tag bl-tag-blue">→ {report.parsed.recommended_assignee}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Section Comparison Bars */}
              <div className="bl-chart-card">
                <h3>Section Comparison</h3>
                {(Object.keys(SECTION_META) as (keyof typeof SECTION_META)[]).map(k => {
                  const va = (A.parsed?.section_scores?.[k] ?? 0);
                  const vb = (B.parsed?.section_scores?.[k] ?? 0);
                  const max = SECTION_META[k].m;
                  const pa = Math.round((va / max) * 100);
                  const pb = Math.round((vb / max) * 100);
                  return (
                    <div className="bl-bar-row" key={k}>
                      <div className="bl-bar-label">{SECTION_META[k].l}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: 3 }}>
                          <span className="bl-mono" style={{ fontSize: '.68rem', color: '#a09a92', width: 12 }}>A</span>
                          <div style={{ flex: 1, height: 13, background: '#f5f2ee', borderRadius: 4, overflow: 'hidden', border: '1px solid #d4cfc5' }}>
                            <div style={{ height: '100%', width: `${pa}%`, background: scoreColor(pa), borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 4, transition: 'width .8s ease' }}>
                              <span className="bl-mono" style={{ fontSize: '.6rem', color: '#fff', fontWeight: 500 }}>{va}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <span className="bl-mono" style={{ fontSize: '.68rem', color: '#a09a92', width: 12 }}>B</span>
                          <div style={{ flex: 1, height: 13, background: '#f5f2ee', borderRadius: 4, overflow: 'hidden', border: '1px solid #d4cfc5' }}>
                            <div style={{ height: '100%', width: `${pb}%`, background: scoreColor(pb), borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 4, transition: 'width .8s ease' }}>
                              <span className="bl-mono" style={{ fontSize: '.6rem', color: '#fff', fontWeight: 500 }}>{vb}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
