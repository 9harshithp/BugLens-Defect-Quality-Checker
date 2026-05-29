import { useState } from 'react';
import { scoreColor, gradeMeta, timeAgo } from '../lib/analysis';
import { useToastTrigger } from '../components/Toast';
import { ResultsModal } from './ResultsModal';
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

  const downloadFile = (content: string, filename: string, type: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename; a.click();
  };

  const safeFilename = (s: string) => s.replace(/\s+/g, '_').slice(0, 40);

  const handleExportCSV = () => {
    if (!history.length) { toast('No history to export'); return; }
    const rows = [['ID','Timestamp','Title','Score','Grade','Risk','Effort','Assignee']];
    history.forEach(h => {
      const p = h.parsed || {};
      rows.push([String(h.id), new Date(h.timestamp).toISOString(), `"${h.title.replace(/"/g,'""')}"`, String(h.score), h.grade, p.risk_level || '', p.estimated_fix_effort || '', p.recommended_assignee || '']);
    });
    downloadFile(rows.map(r => r.join(',')).join('\n'), `buglens_${Date.now()}.csv`, 'text/csv');
    toast(`⬇ Exported ${history.length} records`);
  };

  const handleClear = () => {
    if (window.confirm('Delete all history?')) { onClear(); toast('History cleared'); }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.8rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Analysis History</h1>
          <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>// Persisted per account</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="bl-btn-secondary" onClick={handleExportCSV} data-testid="button-export-csv">⬇ Export CSV</button>
          <button className="bl-btn-secondary" onClick={handleClear} data-testid="button-clear-history" style={{ color: '#c4410c' }}>🗑 Clear All</button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bl-mono" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#a09a92', fontSize: '.84rem', background: '#fffefb', border: '1px solid #d4cfc5', borderRadius: 16 }}>
          No analyses yet. Run your first check in the Analyzer tab.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
          {history.map(h => {
            const col = scoreColor(h.score);
            const gm = gradeMeta(h.score);
            return (
              <div key={h.id} className="bl-hist-item" data-testid={`history-item-${h.id}`}>
                <div className="bl-hist-badge" style={{ borderColor: col, color: col }}>
                  <div style={{ fontSize: '.95rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{h.score}</div>
                  <div style={{ fontSize: '.52rem', opacity: .7, fontFamily: "'DM Mono', monospace" }}>/100</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                  <div className="bl-mono" style={{ fontSize: '.73rem', color: '#a09a92', marginTop: 3 }}>
                    {timeAgo(h.timestamp)} · {user.name}
                    {h.parsed?.recommended_assignee ? ` · → ${h.parsed.recommended_assignee}` : ''}
                  </div>
                </div>
                <div style={{ padding: '.18rem .6rem', borderRadius: 12, fontSize: '.68rem', fontWeight: 600, fontFamily: "'DM Mono', monospace", background: gm.bg, color: gm.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {gm.label}
                </div>
                <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="bl-btn-sm" onClick={() => setModalItem(h)} data-testid={`button-view-${h.id}`}>View</button>
                  <button className="bl-btn-sm" onClick={() => {
                    downloadFile(h.parsed?.rewritten_report || '', `${safeFilename(h.title)}_report.txt`, 'text/plain');
                    toast('⬇ Downloaded TXT');
                  }} data-testid={`button-dl-txt-${h.id}`}>⬇TXT</button>
                  <button className="bl-btn-sm" onClick={() => {
                    const gm2 = gradeMeta(h.score);
                    const c2 = scoreColor(h.score);
                    const content = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Bug Report</title><style>body{font-family:Georgia,serif;max-width:740px;margin:2rem auto;padding:1.5rem;color:#1a1714;background:#f5f2ee}h1{font-size:1.5rem}.meta{font-family:monospace;font-size:.78rem;color:#7a756e;margin-bottom:1.4rem;padding-bottom:.9rem;border-bottom:1px solid #d4cfc5}.chip{display:inline-block;padding:.28rem .85rem;border-radius:20px;font-family:monospace;font-weight:700;color:${c2};background:#f5f2ee;border:2px solid ${c2};margin-right:.45rem}.grade{display:inline-block;padding:.22rem .75rem;border-radius:12px;font-family:monospace;font-size:.78rem;font-weight:600;background:${gm2.bg};color:${gm2.color}}pre{background:#f0ede7;border:1px solid #d4cfc5;border-radius:8px;padding:1.1rem;font-family:monospace;font-size:.8rem;line-height:1.8;white-space:pre-wrap;margin-top:1.1rem}.foot{margin-top:1.8rem;padding-top:.9rem;border-top:1px solid #d4cfc5;font-size:.72rem;color:#a09a92;font-family:monospace}</style></head><body><h1>Bug Report</h1><div class="meta">Generated by BugLens · ${new Date(h.timestamp).toLocaleString()} · ${user.name}</div><span class="chip">${h.score}/100</span><span class="grade">${gm2.label}</span><pre>${(h.parsed?.rewritten_report || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><div class="foot">BugLens Defect Quality Checker</div></body></html>`;
                    downloadFile(content, `${safeFilename(h.title)}_report.html`, 'text/html');
                    toast('⬇ Downloaded HTML');
                  }} data-testid={`button-dl-html-${h.id}`}>⬇HTML</button>
                  <button className="bl-btn-sm del" onClick={() => { onDelete(h.id); toast('Deleted'); }} data-testid={`button-delete-${h.id}`}>✕</button>
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
