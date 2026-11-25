import { useState, useMemo } from 'react';
import { scoreColor, gradeMeta, timeAgo } from '../lib/analysis';
import { DEFECT_CATEGORIES } from '../lib/types';
import { useToastTrigger } from '../components/Toast';
import { ResultsModal } from './ResultsModal';
import { Download, Trash2, X, Search } from 'lucide-react';
import type { HistoryItem, User } from '../lib/types';

interface Props {
  history: HistoryItem[];
  user: User;
  onDelete: (id: number) => void;
  onClear: () => void;
}

export function HistoryPage({ history, user, onDelete, onClear }: Props) {
  const toast = useToastTrigger();
  const [modalItem, setModalItem] = useState<HistoryItem | null>(null);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'score-desc' | 'score-asc'>('newest');

  const filtered = useMemo(() => {
    const now = Date.now();
    return history
      .filter(h => {
        if (search.trim() && !h.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
        const normalizedGrade = h.grade === 'Needs Work' ? 'Needs Improvement' : h.grade;
        if (gradeFilter && normalizedGrade !== gradeFilter) return false;
        if (categoryFilter && h.parsed?.defect_category !== categoryFilter) return false;
        if (severityFilter && (h.fields?.sev || h.parsed?.suggested_severity || '') !== severityFilter) return false;
        if (dateFilter === 'today' && now - h.timestamp > 86_400_000) return false;
        if (dateFilter === '7d' && now - h.timestamp > 7 * 86_400_000) return false;
        if (dateFilter === '30d' && now - h.timestamp > 30 * 86_400_000) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.score - a.score;
        if (sortBy === 'score-asc') return a.score - b.score;
        return b.timestamp - a.timestamp;
      });
  }, [history, search, gradeFilter, categoryFilter, severityFilter, dateFilter, sortBy]);

  const downloadFile = (content: string, filename: string, type: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename; a.click();
  };

  const safeFilename = (s: string) => s.replace(/\s+/g, '_').slice(0, 40);

  const handleExportCSV = () => {
    if (!filtered.length) { toast('No history to export'); return; }
    const rows = [['ID', 'Timestamp', 'Title', 'Status', 'Score', 'Grade', 'Category', 'Severity', 'Risk', 'Effort', 'Team']];
    filtered.forEach(h => {
      const p = h.parsed || {};
      rows.push([
        String(h.id),
        new Date(h.timestamp).toISOString(),
        `"${h.title.replace(/"/g, '""')}"`,
        h.isDraft ? 'Draft' : 'Completed',
        String(h.score),
        h.grade === 'Needs Work' ? 'Needs Improvement' : h.grade,
        p.defect_category || '',
        h.fields?.sev || p.suggested_severity || '',
        p.risk_level || '',
        p.estimated_fix_effort || '',
        p.recommended_assignee || '',
      ]);
    });
    downloadFile(rows.map(r => r.join(',')).join('\n'), `buglens_${Date.now()}.csv`, 'text/csv');
    toast(`Exported ${filtered.length} records`);
  };

  const handleClear = () => {
    if (window.confirm('Delete all history?')) { onClear(); toast('History cleared'); }
  };

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.4rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Analysis History</h1>
          <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>// Persisted per account ({filtered.length} of {history.length})</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="bl-btn-secondary" onClick={handleExportCSV} data-testid="button-export-csv" style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}><Download size={14} /> Export CSV</button>
          <button className="bl-btn-secondary" onClick={handleClear} data-testid="button-clear-history" style={{ color: '#c4410c', display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}><Trash2 size={14} /> Clear All</button>
        </div>
      </div>

      {/* Filters & Search */}
      {history.length > 0 && (
        <div className="bl-card" style={{ padding: '.9rem 1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '.6rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a09a92' }} />
              <input
                className="bl-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search title..."
                data-testid="input-history-search"
                style={{ paddingLeft: 28, fontSize: '.78rem' }}
              />
            </div>
            <select className="bl-select" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} data-testid="filter-grade" style={{ fontSize: '.78rem' }}>
              <option value="">All Grades</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="Incomplete">Incomplete</option>
            </select>
            <select className="bl-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} data-testid="filter-category" style={{ fontSize: '.78rem' }}>
              <option value="">All Categories</option>
              {DEFECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="bl-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} data-testid="filter-severity" style={{ fontSize: '.78rem' }}>
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Trivial">Trivial</option>
            </select>
            <select className="bl-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)} data-testid="filter-date" style={{ fontSize: '.78rem' }}>
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <select className="bl-select" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} data-testid="sort-history" style={{ fontSize: '.78rem' }}>
              <option value="newest">Newest First</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
            </select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bl-mono" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#a09a92', fontSize: '.84rem', background: '#fffefb', border: '1px solid #d4cfc5', borderRadius: 16 }}>
          {history.length === 0 ? 'No analyses yet. Run your first check in the Analyzer tab.' : 'No reports match the selected filters.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
          {filtered.map(h => {
            const col = scoreColor(h.score);
            const gm = gradeMeta(h.score);
            return (
              <div key={h.id} className="bl-hist-item" data-testid={`history-item-${h.id}`}>
                <div className="bl-hist-badge" style={{ borderColor: col, color: col }}>
                  <div style={{ fontSize: '.95rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{h.score}</div>
                  <div style={{ fontSize: '.52rem', opacity: .7, fontFamily: "'DM Mono', monospace" }}>/100</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '.88rem', color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</span>
                    {h.isDraft && (
                      <span className="bl-tag bl-tag-amber" style={{ fontSize: '.62rem', padding: '.08rem .4rem' }}>Draft</span>
                    )}
                  </div>
                  <div className="bl-mono" style={{ fontSize: '.73rem', color: '#a09a92', marginTop: 3 }}>
                    {timeAgo(h.timestamp)} · {user.name}
                    {h.parsed?.defect_category ? ` · ${h.parsed.defect_category}` : ''}
                    {h.parsed?.recommended_assignee ? ` · ${h.parsed.recommended_assignee}` : ''}
                  </div>
                </div>
                <div style={{ padding: '.18rem .6rem', borderRadius: 12, fontSize: '.68rem', fontWeight: 600, fontFamily: "'DM Mono', monospace", background: gm.bg, color: gm.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {gm.label}
                </div>
                <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="bl-btn-sm" onClick={() => setModalItem(h)} data-testid={`button-view-${h.id}`}>View</button>
                  <button className="bl-btn-sm" onClick={() => {
                    downloadFile(h.parsed?.rewritten_report || '', `${safeFilename(h.title)}_report.txt`, 'text/plain');
                    toast('Downloaded TXT');
                  }} data-testid={`button-dl-txt-${h.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Download size={11} /> TXT</button>
                  <button className="bl-btn-sm" onClick={() => {
                    const gm2 = gradeMeta(h.score);
                    const c2 = scoreColor(h.score);
                    const content = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Bug Report</title><style>body{font-family:Georgia,serif;max-width:740px;margin:2rem auto;padding:1.5rem;color:#1a1714;background:#f5f2ee}h1{font-size:1.5rem}.meta{font-family:monospace;font-size:.78rem;color:#7a756e;margin-bottom:1.4rem;padding-bottom:.9rem;border-bottom:1px solid #d4cfc5}.chip{display:inline-block;padding:.28rem .85rem;border-radius:20px;font-family:monospace;font-weight:700;color:${c2};background:#f5f2ee;border:2px solid ${c2};margin-right:.45rem}.grade{display:inline-block;padding:.22rem .75rem;border-radius:12px;font-family:monospace;font-size:.78rem;font-weight:600;background:${gm2.bg};color:${gm2.color}}pre{background:#f0ede7;border:1px solid #d4cfc5;border-radius:8px;padding:1.1rem;font-family:monospace;font-size:.8rem;line-height:1.8;white-space:pre-wrap;margin-top:1.1rem}.foot{margin-top:1.8rem;padding-top:.9rem;border-top:1px solid #d4cfc5;font-size:.72rem;color:#a09a92;font-family:monospace}</style></head><body><h1>Bug Report</h1><div class="meta">Generated by BugLens · ${new Date(h.timestamp).toLocaleString()} · ${user.name}</div><span class="chip">${h.score}/100</span><span class="grade">${gm2.label}</span><pre>${(h.parsed?.rewritten_report || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><div class="foot">BugLens Defect Quality Intelligence</div></body></html>`;
                    downloadFile(content, `${safeFilename(h.title)}_report.html`, 'text/html');
                    toast('Downloaded HTML');
                  }} data-testid={`button-dl-html-${h.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Download size={11} /> HTML</button>
                  <button className="bl-btn-sm del" onClick={() => { onDelete(h.id); toast('Deleted'); }} data-testid={`button-delete-${h.id}`} aria-label="Delete report"><X size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalItem && (
        <ResultsModal item={modalItem} user={user} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}
