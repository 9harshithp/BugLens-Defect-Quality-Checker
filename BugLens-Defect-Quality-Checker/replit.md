# BugLens — Defect Quality Checker

AI-powered defect report quality analysis platform that scores, rewrites, and improves bug reports for QA teams.

## Run & Operate

- `pnpm --filter @workspace/buglens run dev` — run the frontend app (port 22282)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7
- State: React hooks + localStorage (no backend required)
- Fonts: Instrument Serif, Outfit, DM Mono (Google Fonts)
- Analysis: Rule-based scoring engine + optional Anthropic API (claude-sonnet-4)

## Where things live

- `artifacts/buglens/src/App.tsx` — main app entry point, state wiring
- `artifacts/buglens/src/index.css` — full BugLens design system (all `.bl-*` classes)
- `artifacts/buglens/src/lib/types.ts` — TypeScript interfaces
- `artifacts/buglens/src/lib/analysis.ts` — scoring engine, exception parser, AI analysis
- `artifacts/buglens/src/lib/store.ts` — auth and history state management
- `artifacts/buglens/src/pages/` — LoginPage, AnalyzerPage, ResultsPanel, HistoryPage, ComparePage, DashboardPage, ResultsModal
- `artifacts/buglens/src/components/` — Navbar, ScoreRing, Toast

## Demo Accounts

| Role      | Username  | Password  |
|-----------|-----------|-----------|
| Admin     | admin     | admin123  |
| QA Lead   | qa_lead   | qa1234    |
| Developer | dev_user  | dev5678   |
| Analyst   | analyst   | pass2024  |

History is persisted per account in localStorage (`bl_<username>`).

## Architecture decisions

- Purely frontend app — no database required; localStorage handles history (50 items per user)
- Rule-based analysis is the default; Anthropic API key enables AI-powered analysis
- All BugLens CSS uses custom `.bl-*` classes defined in `index.css` with exact hex values — not Tailwind utilities — to match the original HTML design exactly
- Google Fonts import must be the first line of `index.css` (before `@import "tailwindcss"`) — PostCSS requirement
- Toast system uses a global singleton pattern (`globalShowToast`) to allow any component to trigger toasts without prop-drilling

## Product

Five views:
1. **Analyzer** — fill defect fields, get real-time completeness bar, AI analysis with 7-section scoring, exception detection, suggestions, professional rewrite, and TXT/MD/HTML/JSON downloads
2. **History** — all past analyses per user with view, download, and delete actions, plus CSV export
3. **Compare** — side-by-side report comparison with section-by-section bar charts and winner badge
4. **Dashboard** — aggregate stats, score trend spark chart, grade distribution, assignee breakdown, recent analyses

## User preferences

- Design system: exact clone of provided HTML/CSS with colors #f5f2ee bg, #fffefb surface, #c4410c accent, #1d6b4e green, #1e4b8a blue, #b5830a amber
- Score ring uses SVG circle dash-array animation
- All download buttons produce real files via Blob URLs

## Gotchas

- Do NOT use Tailwind utility classes for BugLens-specific styling — always use `.bl-*` CSS classes or inline styles with exact hex values
- `@import url(...)` for Google Fonts MUST be the very first line of `index.css`
- Analysis engine in `analysis.ts` uses `fetch` directly to Anthropic API with `anthropic-dangerous-direct-browser-access: true` header (required for browser-side API calls)
