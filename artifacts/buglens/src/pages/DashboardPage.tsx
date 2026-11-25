import { useState } from 'react';
import { scoreColor, gradeMeta, timeAgo } from '../lib/analysis';
import { SECTION_META, type HistoryItem, type SectionKey, type User } from '../lib/types';
import { ResultsModal } from './ResultsModal';

interface Props {
  history: HistoryItem[];
  user: User;
}

const GRADE_COLORS: Record<string, string> = {
  Excellent:           '#1d6b4e',
  Good:                '#1e4b8a',
  'Needs Improvement': '#b5830a',
  Incomplete:          '#c4410c',
};

export function DashboardPage({ history, user }: Props) {
  const [modalItem, setModalItem] = useState<HistoryItem | null>(null);

  if (!history.length) {
    return (
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '1.8rem' }}>
          <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Quality Dashboard</h1>
          <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>// Aggregate defect quality intelligence</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#a09a92', fontFamily: "'DM Mono', monospace", fontSize: '.82rem', background: '#fffefb', border: '1px solid #d4cfc5', borderRadius: 16 }}>
          No data yet — run some analyses first!
        </div>
      </div>
    );
  }

  const total = history.length;
  const avg = Math.round(history.reduce((a, b) => a + b.score, 0) / total);
  const passing = history.filter(h => h.score >= 75).length;
  const incomplete = history.filter(h => h.score < 55).length;

  const oldest = history[history.length - 1];
  const newest = history[0];
  const qualityDelta = total >= 2 ? newest.score - oldest.score : 0;

  const grades: Record<string, number> = { Excellent: 0, Good: 0, 'Needs Improvement': 0, Incomplete: 0 };
  const categories: Record<string, number> = {};
  const severities: Record<string, number> = {};
  const assignees: Record<string, number> = {};
  const missingFields: Record<string, number> = {};
  const sectionTotals: Record<SectionKey, number> = {
    title: 0, description: 0, steps: 0, expected_actual: 0, environment: 0, severity: 0, attachments: 0,
  };

  history.forEach(h => {
    const g = h.grade === 'Needs Work' ? 'Needs Improvement' : h.grade;
    grades[g] = (grades[g] || 0) + 1;

    const cat = h.parsed?.defect_category || 'Functional';
    categories[cat] = (categories[cat] || 0) + 1;

    const sev = h.fields?.sev || h.parsed?.suggested_severity || 'Unspecified';
    severities[sev] = (severities[sev] || 0) + 1;

    const a = h.parsed?.recommended_assignee || 'Unknown';
    assignees[a] = (assignees[a] || 0) + 1;

    (h.parsed?.missing_alerts || []).forEach(al => {
      missingFields[al.field] = (missingFields[al.field] || 0) + 1;
    });

    (Object.keys(SECTION_META) as SectionKey[]).forEach(k => {
      sectionTotals[k] += h.parsed?.section_scores?.[k] ?? 0;
    });
  });

  const sparkItems = [...history].reverse().slice(0, 20);
  const topCategories = Object.keys(categories).sort((a, b) => categories[b] - categories[a]).slice(0, 6);
  const topSeverities = Object.keys(severities).sort((a, b) => severities[b] - severities[a]);
  const topAssignees = Object.keys(assignees).sort((a, b) => assignees[b] - assignees[a]).slice(0, 6);
  const topMissing = Object.keys(missingFields).sort((a, b) => missingFields[b] - missingFields[a]).slice(0, 5);
  const mostCommonMissing = topMissing[0] || 'None';

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.8rem' }}>
        <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Quality Dashboard</h1>
        <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>// Aggregate defect quality intelligence ({user.role})</p>
      </div>

      {/* KPI Cards */}
      <div className="bl-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))' }}>
        {[
          { label: 'Total Reports', value: String(total), sub: 'analyzed', color: '#1a1714' },
          { label: 'Average Score', value: String(avg), sub: 'out of 100', color: scoreColor(avg) },
          { label: 'Passing >= 75', value: String(passing), sub: `${Math.round((passing / total) * 100)}% of total`, color: '#1d6b4e' },
          { label: 'Incomplete < 55', value: String(incomplete), sub: 'need rework', color: '#c4410c' },
          { label: 'Quality Trend', value: `${qualityDelta >= 0 ? '+' : ''}${qualityDelta}`, sub: 'latest vs earliest', color: qualityDelta >= 0 ? '#1d6b4e' : '#c4410c' },
          { label: 'Top Missing Field', value: mostCommonMissing, sub: topMissing[0] ? `${missingFields[topMissing[0]]} reports` : 'none', color: '#b5830a', small: true },
        ].map(s => (
          <div className="bl-stat-card" key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="bl-mono" style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#a09a92', marginBottom: '.28rem' }}>{s.label}</div>
            <div className="bl-mono" style={{ fontSize: s.small ? '1.05rem' : '1.75rem', fontWeight: 700, lineHeight: 1.15, color: s.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
            <div style={{ fontSize: '.72rem', color: '#a09a92', marginTop: '.22rem' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Score Trend Spark chart */}
      <div className="bl-chart-card">
        <h3>Quality Score Trend (last {Math.min(20, total)} reports)</h3>
        <div className="bl-spark">
          {sparkItems.map((h, i) => (
            <div
              key={i}
              className="bl-spark-bar"
              title={`${h.score}/100 — ${h.title.slice(0, 30)}`}
              style={{ height: `${Math.max(4, h.score)}%`, background: scoreColor(h.score) }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.63rem', fontFamily: "'DM Mono', monospace", color: '#a09a92', marginTop: '.25rem' }}>
          <span>oldest</span><span>newest</span>
        </div>
      </div>

      {/* Grade + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '.9rem' }}>
        <div className="bl-chart-card" style={{ marginBottom: 0 }}>
          <h3>Grade Distribution</h3>
          {Object.entries(grades).map(([g, cnt]) => {
            const pct = Math.round((cnt / total) * 100);
            return (
              <div className="bl-bar-row" key={g}>
                <div className="bl-bar-label">{g}</div>
                <div className="bl-bar-track">
                  <div className="bl-bar-fill" style={{ width: `${pct}%`, background: GRADE_COLORS[g] || '#7a756e' }}>
                    <span>{pct}%</span>
                  </div>
                </div>
                <div className="bl-bar-num">{cnt}</div>
              </div>
            );
          })}
        </div>

        <div className="bl-chart-card" style={{ marginBottom: 0 }}>
          <h3>Defect Category Distribution</h3>
          {topCategories.map(c => {
            const cnt = categories[c];
            const pct = Math.round((cnt / total) * 100);
            return (
              <div className="bl-bar-row" key={c}>
                <div className="bl-bar-label">{c}</div>
                <div className="bl-bar-track">
                  <div className="bl-bar-fill" style={{ width: `${pct}%`, background: '#1e4b8a' }}>
                    <span>{pct}%</span>
                  </div>
                </div>
                <div className="bl-bar-num">{cnt}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section Averages + Severity + Assignees + Missing Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '.9rem' }}>
        <div className="bl-chart-card" style={{ marginBottom: 0 }}>
          <h3>Section-Wise Average Scores</h3>
          {(Object.keys(SECTION_META) as SectionKey[]).map(k => {
            const avgSec = Math.round((sectionTotals[k] / total) * 10) / 10;
            const max = SECTION_META[k].m;
            const pct = Math.round((avgSec / max) * 100);
            return (
              <div className="bl-bar-row" key={k}>
                <div className="bl-bar-label">{SECTION_META[k].l}</div>
                <div className="bl-bar-track">
                  <div className="bl-bar-fill" style={{ width: `${pct}%`, background: scoreColor(pct) }}>
                    <span>{avgSec}/{max}</span>
                  </div>
                </div>
                <div className="bl-bar-num">{pct}%</div>
              </div>
            );
          })}
        </div>

        <div className="bl-chart-card" style={{ marginBottom: 0 }}>
          <h3>Severity Distribution</h3>
          {topSeverities.map(s => {
            const cnt = severities[s];
            const pct = Math.round((cnt / total) * 100);
            return (
              <div className="bl-bar-row" key={s}>
                <div className="bl-bar-label">{s}</div>
                <div className="bl-bar-track">
                  <div className="bl-bar-fill" style={{ width: `${pct}%`, background: s === 'Critical' || s === 'High' ? '#c4410c' : s === 'Medium' ? '#b5830a' : '#1d6b4e' }}>
                    <span>{pct}%</span>
                  </div>
                </div>
                <div className="bl-bar-num">{cnt}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '.9rem' }}>
        <div className="bl-chart-card" style={{ marginBottom: 0 }}>
          <h3>Recommended Engineering Team</h3>
          {topAssignees.map(a => {
            const cnt = assignees[a];
            const pct = Math.round((cnt / total) * 100);
            return (
              <div className="bl-bar-row" key={a}>
                <div className="bl-bar-label">{a}</div>
                <div className="bl-bar-track">
                  <div className="bl-bar-fill" style={{ width: `${pct}%`, background: '#1e4b8a' }}>
                    <span>{pct}%</span>
                  </div>
                </div>
                <div className="bl-bar-num">{cnt}</div>
              </div>
            );
          })}
        </div>

        <div className="bl-chart-card" style={{ marginBottom: 0 }}>
          <h3>Most Frequently Missing Fields</h3>
          {topMissing.length === 0 ? (
            <div className="bl-mono" style={{ padding: '1.5rem 0', textAlign: 'center', fontSize: '.78rem', color: '#1d6b4e' }}>
              No missing fields recorded.
            </div>
          ) : topMissing.map(f => {
            const cnt = missingFields[f];
            const pct = Math.round((cnt / total) * 100);
            return (
              <div className="bl-bar-row" key={f}>
                <div className="bl-bar-label">{f}</div>
                <div className="bl-bar-track">
                  <div className="bl-bar-fill" style={{ width: `${pct}%`, background: '#c4410c' }}>
                    <span>{pct}%</span>
                  </div>
                </div>
                <div className="bl-bar-num">{cnt}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bl-chart-card">
        <h3>Recent Reports</h3>
        {history.slice(0, 6).map(h => {
          const gm = gradeMeta(h.score);
          const col = scoreColor(h.score);
          return (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.5rem 0', borderBottom: '1px solid #f0ede7' }}>
              <span className="bl-mono" style={{ fontWeight: 700, color: col, minWidth: 36 }}>{h.score}</span>
              <span style={{ flex: 1, fontSize: '.84rem', color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</span>
              <span style={{ padding: '.15rem .55rem', borderRadius: 10, fontSize: '.65rem', fontFamily: "'DM Mono', monospace", fontWeight: 600, background: gm.bg, color: gm.color }}>{gm.label}</span>
              <span className="bl-mono" style={{ fontSize: '.7rem', color: '#a09a92' }}>{timeAgo(h.timestamp)}</span>
              <button className="bl-btn-sm" onClick={() => setModalItem(h)}>View</button>
            </div>
          );
        })}
      </div>

      {modalItem && <ResultsModal item={modalItem} user={user} onClose={() => setModalItem(null)} />}
    </div>
  );
}
