import { useState, useEffect, useRef } from 'react';
import { gradeMeta, scoreColor, timeAgo } from '../lib/analysis';
import type { TeamFeedItem, User } from '../lib/types';

const KNOWN_USERS = ['admin', 'qa_lead', 'dev_user', 'analyst'];
const KNOWN_NAMES: Record<string, string> = {
  admin: 'Alex Admin', qa_lead: 'Quinn Arora',
  dev_user: 'Dev Patel', analyst: 'Ana Silva',
};

interface Props {
  teamFeed: TeamFeedItem[];
  user: User;
  onAddComment: (feedId: number, text: string, user: User) => void;
  onRemove: (feedId: number) => void;
}

function ScoreBadge({ score }: { score: number }) {
  const gm = gradeMeta(score);
  const col = scoreColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: `3px solid ${col}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#fffefb',
      }}>
        <span style={{ fontSize: '.85rem', fontWeight: 800, color: col, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '.5rem', color: '#a09a92', fontFamily: "'DM Mono', monospace" }}>/100</span>
      </div>
      <span style={{ fontSize: '.72rem', fontWeight: 600, fontFamily: "'DM Mono', monospace", color: gm.color, background: gm.bg, padding: '.2rem .6rem', borderRadius: 10 }}>
        {gm.label}
      </span>
    </div>
  );
}

function Avatar({ name, role }: { name: string; role: string }) {
  const colors: Record<string, string> = {
    Admin: '#c4410c', 'QA Lead': '#1d6b4e', Developer: '#1e4b8a',
    Analyst: '#b5830a', 'QA Engineer': '#7c3aed', DevOps: '#0891b2',
  };
  const bg = colors[role] ?? '#6b7280';
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {name[0]}
    </div>
  );
}

function renderCommentText(text: string) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+$/.test(part)
      ? <span key={i} style={{ color: '#1e4b8a', fontWeight: 600, background: '#e8f0fa', borderRadius: 4, padding: '0 3px' }}>{part}</span>
      : <span key={i}>{part}</span>
  );
}

function MentionDropdown({ query, onSelect }: { query: string; onSelect: (u: string) => void }) {
  const matches = KNOWN_USERS.filter(u => u.toLowerCase().startsWith(query.toLowerCase()));
  if (!matches.length) return null;
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, background: '#fffefb',
      border: '1px solid #d4cfc5', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,.1)',
      zIndex: 50, minWidth: 180, overflow: 'hidden', marginBottom: 4,
    }}>
      {matches.map(u => (
        <button key={u} onClick={() => onSelect(u)} style={{
          display: 'flex', alignItems: 'center', gap: '.55rem', width: '100%',
          padding: '.5rem .85rem', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: "'Outfit', sans-serif",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f5f2ee')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1e4b8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', color: '#fff', fontWeight: 700 }}>
            {KNOWN_NAMES[u]?.[0] ?? u[0]}
          </div>
          <div>
            <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#1a1714' }}>{KNOWN_NAMES[u] ?? u}</div>
            <div style={{ fontSize: '.65rem', color: '#a09a92', fontFamily: "'DM Mono', monospace" }}>@{u}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function FeedCard({ item, currentUser, onAddComment, onRemove }: {
  item: TeamFeedItem;
  currentUser: User;
  onAddComment: (feedId: number, text: string, user: User) => void;
  onRemove: (feedId: number) => void;
}) {
  const [commentText, setCommentText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommentText(val);
    const match = val.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const insertMention = (username: string) => {
    const replaced = commentText.replace(/@\w*$/, `@${username} `);
    setCommentText(replaced);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    onAddComment(item.id, commentText.trim(), currentUser);
    setCommentText('');
    setMentionQuery(null);
    setShowComments(true);
  };

  const isOwner = currentUser.username === item.sharedBy.username || currentUser.role === 'Admin';

  const topSections = Object.entries(item.parsed.section_scores)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3);

  const mentionsInComments = item.comments.filter(c => c.text.includes(`@${currentUser.username}`));
  const hasMention = mentionsInComments.length > 0;

  return (
    <div className="bl-card" style={{ marginBottom: '1rem', position: 'relative' }}>
      {hasMention && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: '#1e4b8a', color: '#fff', fontSize: '.62rem',
          fontFamily: "'DM Mono', monospace", fontWeight: 700,
          padding: '.18rem .55rem', borderRadius: 20,
        }}>@you</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.9rem', gap: '.5rem' }}>
        <div style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start', flex: 1 }}>
          <Avatar name={item.sharedBy.name} role={item.sharedBy.role} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '.88rem', color: '#1a1714' }}>{item.sharedBy.name}</span>
              <span style={{ fontSize: '.7rem', color: '#a09a92', fontFamily: "'DM Mono', monospace", background: '#f0ede7', padding: '.1rem .5rem', borderRadius: 8 }}>{item.sharedBy.role}</span>
              <span style={{ fontSize: '.72rem', color: '#a09a92', fontFamily: "'DM Mono', monospace" }}>shared a report</span>
            </div>
            <div style={{ fontSize: '.72rem', color: '#a09a92', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{timeAgo(item.timestamp)}</div>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => onRemove(item.id)}
            style={{ background: 'none', border: 'none', color: '#a09a92', cursor: 'pointer', fontSize: '.75rem', fontFamily: "'DM Mono', monospace", padding: '.2rem .4rem', borderRadius: 6, transition: 'color .12s', marginTop: hasMention ? 20 : 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c4410c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a09a92')}
            title="Remove from feed"
          >✕ remove</button>
        )}
      </div>

      {/* Report Title + Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap', padding: '.8rem 1rem', background: '#f8f6f2', borderRadius: 12, marginBottom: '.85rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.72rem', color: '#a09a92', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>Bug Report</div>
          <div style={{ fontWeight: 600, fontSize: '.92rem', color: '#1a1714', wordBreak: 'break-word' }}>{item.reportTitle || '(untitled)'}</div>
          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.68rem', padding: '.15rem .5rem', borderRadius: 8, background: item.parsed.risk_level === 'High' ? '#fef2ee' : item.parsed.risk_level === 'Medium' ? '#fef8e8' : '#e8f5f0', color: item.parsed.risk_level === 'High' ? '#c4410c' : item.parsed.risk_level === 'Medium' ? '#b5830a' : '#1d6b4e', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
              Risk: {item.parsed.risk_level}
            </span>
            <span style={{ fontSize: '.68rem', padding: '.15rem .5rem', borderRadius: 8, background: '#e8f0fa', color: '#1e4b8a', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
              → {item.parsed.recommended_assignee}
            </span>
          </div>
        </div>
        <ScoreBadge score={item.score} />
      </div>

      {/* Top section scores mini-bar */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.7rem', flexWrap: 'wrap' }}>
        {topSections.map(([key, val]) => {
          const score = val as number;
          const labels: Record<string, string> = { title: 'Title', description: 'Desc', steps: 'Steps', expected_actual: 'Exp/Act', environment: 'Env', severity: 'Severity', attachments: 'Attach' };
          const maxes: Record<string, number> = { title: 20, description: 20, steps: 20, expected_actual: 15, environment: 15, severity: 5, attachments: 5 };
          const pct = Math.round((score / (maxes[key] || 20)) * 100);
          const c = scoreColor(pct);
          return (
            <div key={key} style={{ flex: 1, minWidth: 70 }}>
              <div style={{ fontSize: '.63rem', color: '#7a756e', fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>{labels[key]} · {score}/{maxes[key]}</div>
              <div style={{ height: 4, background: '#e8e3db', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: 2, transition: 'width .6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand details */}
      <button
        onClick={() => setExpanded(x => !x)}
        style={{ background: 'none', border: 'none', color: '#7a756e', cursor: 'pointer', fontSize: '.78rem', fontFamily: "'DM Mono', monospace", padding: 0, marginBottom: '.6rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}
      >
        <span style={{ transition: 'transform .15s', display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</span>
        {expanded ? 'Hide details' : 'View suggestions & details'}
      </button>

      {expanded && (
        <div style={{ background: '#f8f6f2', borderRadius: 10, padding: '.9rem 1rem', marginBottom: '.7rem', fontSize: '.8rem', color: '#4a4540' }}>
          {item.parsed.suggestions.slice(0, 3).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '.5rem', marginBottom: '.45rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#b5830a', flexShrink: 0, marginTop: 1 }}>💡</span>
              <span>{s}</span>
            </div>
          ))}
          {item.parsed.test_case_hint && (
            <div style={{ marginTop: '.5rem', padding: '.6rem .8rem', background: '#e8f0fa', borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: '.72rem', color: '#1e4b8a' }}>
              🧪 {item.parsed.test_case_hint}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div style={{ borderTop: '1px solid #e8e3db', paddingTop: '.75rem' }}>
        <button
          onClick={() => setShowComments(x => !x)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.78rem', color: '#7a756e', fontFamily: "'DM Mono', monospace", padding: 0, marginBottom: showComments ? '.6rem' : 0 }}
        >
          💬 {item.comments.length} comment{item.comments.length !== 1 ? 's' : ''} {showComments ? '▲' : '▼'}
        </button>

        {showComments && (
          <>
            {item.comments.length > 0 && (
              <div style={{ marginBottom: '.6rem' }}>
                {item.comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem', alignItems: 'flex-start' }}>
                    <Avatar name={c.name} role={c.role} />
                    <div style={{ flex: 1, background: '#f8f6f2', borderRadius: 10, padding: '.5rem .75rem' }}>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '.8rem', color: '#1a1714' }}>{c.name}</span>
                        <span style={{ fontSize: '.65rem', color: '#a09a92', fontFamily: "'DM Mono', monospace" }}>{timeAgo(c.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: '.82rem', color: '#4a4540', lineHeight: 1.5 }}>{renderCommentText(c.text)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end', position: 'relative' }}>
              <Avatar name={currentUser.name} role={currentUser.role} />
              <div style={{ flex: 1, display: 'flex', gap: '.4rem', position: 'relative' }}>
                {mentionQuery !== null && (
                  <MentionDropdown query={mentionQuery} onSelect={insertMention} />
                )}
                <input
                  ref={inputRef}
                  className="bl-input"
                  style={{ flex: 1, fontSize: '.82rem', padding: '.45rem .8rem' }}
                  placeholder={`Comment as ${currentUser.name}… type @ to mention`}
                  value={commentText}
                  onChange={handleCommentChange}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && mentionQuery === null) handleComment();
                    if (e.key === 'Escape') setMentionQuery(null);
                  }}
                />
                <button
                  className="bl-btn-primary"
                  style={{ fontSize: '.78rem', padding: '.45rem .9rem' }}
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                >Post</button>
              </div>
            </div>
            <div style={{ marginTop: 4, paddingLeft: 44, fontFamily: "'DM Mono', monospace", fontSize: '.62rem', color: '#a09a92' }}>
              type @ to mention a teammate
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TeamFeedPage({ teamFeed, user, onAddComment, onRemove }: Props) {
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [filterBy, setFilterBy] = useState<'all' | 'mine' | 'mentioned'>('all');

  useEffect(() => {
    setLastRefresh(Date.now());
    setSecondsAgo(0);
  }, [teamFeed]);

  useEffect(() => {
    const t = setInterval(() => setSecondsAgo(Math.round((Date.now() - lastRefresh) / 1000)), 1000);
    return () => clearInterval(t);
  }, [lastRefresh]);

  const uniqueUsers = [...new Set(teamFeed.map(f => f.sharedBy.username))].length;
  const avgScore = teamFeed.length
    ? Math.round(teamFeed.reduce((s, f) => s + f.score, 0) / teamFeed.length)
    : 0;

  const totalComments = teamFeed.reduce((s, f) => s + f.comments.length, 0);

  const filtered = teamFeed.filter(item => {
    if (filterBy === 'mine') return item.sharedBy.username === user.username;
    if (filterBy === 'mentioned') return item.comments.some(c => c.text.includes(`@${user.username}`));
    return true;
  });

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.4rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <h1 className="bl-serif" style={{ fontSize: '1.75rem', color: '#1a1714' }}>Team Feed</h1>
          <p className="bl-mono" style={{ fontSize: '.84rem', color: '#7a756e', marginTop: '.3rem' }}>// Shared defect reports · team comments · collaborative review</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontFamily: "'DM Mono', monospace", fontSize: '.65rem', color: '#a09a92' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1d6b4e', animation: 'bl-pulse 2s infinite' }} />
          live · syncs every 3s · {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}
        </div>
      </div>

      {/* Stats bar */}
      {teamFeed.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem', marginBottom: '1.2rem' }}>
          {[
            { label: 'Shared Reports', value: teamFeed.length, color: '#1e4b8a' },
            { label: 'Contributors', value: uniqueUsers, color: '#1d6b4e' },
            { label: 'Comments', value: totalComments, color: '#b5830a' },
            { label: 'Avg Score', value: `${avgScore}/100`, color: avgScore >= 75 ? '#1d6b4e' : avgScore >= 55 ? '#b5830a' : '#c4410c' },
          ].map(s => (
            <div key={s.label} className="bl-card" style={{ padding: '.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
              <div style={{ fontSize: '.68rem', color: '#7a756e', marginTop: '.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {teamFeed.length > 0 && (
        <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.2rem' }}>
          {(['all', 'mine', 'mentioned'] as const).map(f => (
            <button key={f} onClick={() => setFilterBy(f)} style={{
              padding: '.35rem .85rem', borderRadius: 20, border: '1px solid',
              fontSize: '.75rem', fontFamily: "'DM Mono', monospace", cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
              background: filterBy === f ? '#1e4b8a' : '#fffefb',
              color: filterBy === f ? '#fff' : '#7a756e',
              borderColor: filterBy === f ? '#1e4b8a' : '#d4cfc5',
            }}>
              {f === 'all' ? `All (${teamFeed.length})` : f === 'mine' ? 'My Reports' : `@Mentions`}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      {teamFeed.length === 0 ? (
        <div className="bl-card" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#7a756e' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
          <div className="bl-serif" style={{ fontSize: '1.2rem', color: '#1a1714', marginBottom: '.5rem' }}>No shared reports yet</div>
          <div style={{ fontSize: '.85rem' }}>
            Analyze a bug report and click <strong>Share to Team</strong> to start the team feed.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bl-card" style={{ textAlign: 'center', padding: '2.5rem 2rem', color: '#7a756e' }}>
          <div style={{ fontSize: '.9rem' }}>No reports match this filter.</div>
        </div>
      ) : (
        filtered.map(item => (
          <FeedCard
            key={item.id}
            item={item}
            currentUser={user}
            onAddComment={onAddComment}
            onRemove={onRemove}
          />
        ))
      )}
    </div>
  );
}
