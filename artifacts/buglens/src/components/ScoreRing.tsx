import { scoreColor } from '../lib/analysis';

interface Props {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 116 }: Props) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const fill = c * (score / 100);
  const col = scoreColor(score);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e4dc" strokeWidth="9" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={col} strokeWidth="9"
          strokeDasharray={`${fill} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: col, lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontSize: '.63rem', color: '#a09a92', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
          /100
        </div>
      </div>
    </div>
  );
}
