import { useState } from 'react';
import { scoreColor, gradeMeta, timeAgo } from '../lib/analysis';
import { ResultsModal } from './ResultsModal';
import type { HistoryItem, User } from '../lib/types';

interface Props {
  history: HistoryItem[];
  user: User;
}

const GRADE_COLORS: Record<string, string> = {
  Excellent:   '#1d6b4e',
  Good:        '#1e4b8a',
  'Needs Work': '#b5830a',
  Incomplete:  '#c4410c',
};

export function DashboardPage({ history, user }: Props) {
  const [modalItem, setModalItem] = useState<HistoryItem | null>(null);

  if (!history.length) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '1.8rem' }}>
          <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Quality Dashboard</h1>
          <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>// Aggregate insights</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#a09a92', fontFamily: "'DM Mono', monospace", fontSize: '.82rem', background: '#fffefb', border: '1px solid #d4cfc5', borderRadius: 16 }}>
          No data yet — run some analyses first!
        </div>
      </div>
    );
  }

  const total = history.length;
  const avg = Math.round(history.reduce((a, b) => a + b.score, 0) / total);
  const passing = history.filter(h => h.score >= 75).length;
  const critical = history.filter(h => h.score < 55).length;

  const grades: Record<string, number> = { Excellent: 0, Good: 0, 'Needs Work': 0, Incomplete: 0 };
  history.forEach(h => { grades[h.grade] = (grades[h.grade] || 0) + 1; });

  const assignees: Record<string, number> = {};
  history.forEach(h => {
    const a = h.parsed?.recommended_assignee || 'Unknown';
    assignees[a] = (assignees[a] || 0) + 1;
  });

  const sparkItems = [...history].reverse().slice(0, 20);
  const topAssignees = Object.keys(assignees).sort((a, b) => assignees[b] - assignees[a]).slice(0, 6);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.8rem' }}>
        <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Quality Dashboard</h1>
        <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>// Aggregate insights</p>
      </div>

      {/* Stat Cards */}
      <div className="bl-stat-grid">
        {[
          { label: 'Total Analyses', value: total, sub: 'reports checked', color: '#1a1714' },
          { label: 'Average Score',  value: avg,   sub: 'out of 100',      color: scoreColor(avg) },
          { label: 'Passing ≥ 75',   value: passing, sub: `${Math.round((passing/total)*100)}% of total`, color: '#1d6b4e' },
          { label: 'Critical < 55',  value: critical, sub: 'need rework',  color: '#c4410c' },
        ].map(s => (
          <div className="bl-stat-card" key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g,'-')}`}>
            <div className="bl-mono" style={{ fontSize: '.67rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#a09a92', marginBottom: '.28rem' }}>{s.label}</div>
            <div className="bl-mono" style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '.73rem', color: '#a09a92', marginTop: '.22rem' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Score Trend Spark chart */}
      <div className="bl-chart-card">
        <h3>Score Trend (last {Math.min(20, total)} reports)</h3>
        <div className="bl-spark">
          {sparkItems.map((h, i) => (
            <div
              key={i}
              className="bl-spark-bar"
              title={`${h.score}/100 — ${h.title.slice(0, 30)}`}
              style={{ height: `${h.score}%`, background: scoreColor(h.score) }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.63rem', fontFamily: "'DM Mono', monospace", color: '#a09a92', marginTop: '.25rem' }}>
          <span>oldest</span><span>newest →</span>
        </div>
      </div>

      {/* Grade + Assignee */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '.9rem' }}>
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
          <h3>Recommended Assignee</h3>
          {topAssignees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#a09a92', fontFamily: "'DM Mono', monospace", fontSize: '.82rem' }}>No data</div>
          ) : topAssignees.map(a => {
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
      </div>

      {/* Recent Analyses */}
      <div className="bl-chart-card">
        <h3>Recent Analyses</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
          {history.slice(0, 5).map(h => {
            const col = scoreColor(h.score);
            const gm = gradeMeta(h.score);
            return (
              <div
                key={h.id}
                onClick={() => setModalItem(h)}
                data-testid={`dashboard-recent-${h.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '.9rem', cursor: 'pointer', padding: '.6rem .8rem', borderRadius: 10, transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f2ee'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2.5px solid ${col}`, color: col, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div className="bl-mono" style={{ fontSize: '.84rem', fontWeight: 700, lineHeight: 1 }}>{h.score}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                  <div className="bl-mono" style={{ fontSize: '.73rem', color: '#a09a92', marginTop: 3 }}>{timeAgo(h.timestamp)}</div>
                </div>
                <div style={{ padding: '.18rem .6rem', borderRadius: 12, fontSize: '.68rem', fontWeight: 600, fontFamily: "'DM Mono', monospace", background: gm.bg, color: gm.color, flexShrink: 0 }}>
                  {gm.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalItem && <ResultsModal item={modalItem} user={user} onClose={() => setModalItem(null)} />}
    </div>
  );
}
