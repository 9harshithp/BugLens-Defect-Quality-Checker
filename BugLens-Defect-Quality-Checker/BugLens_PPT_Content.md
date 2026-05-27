# BugLens — PPT Presentation Content
### AI-Powered Defect Quality Checker | Agile Methodology

---

## SLIDE 1 — Title Slide

**Project Name:** BugLens — AI-Powered Defect Quality Checker

**Tagline:** "Improving bug report quality before it reaches development"

**Presented by:** 9harshithp

**GitHub:** github.com/9harshithp/BugLens-Defect-Quality-Checker

**Methodology:** Agile (4 Sprints)

**Tech Stack:** React 19 + Node.js 24

---

## SLIDE 2 — Problem Statement

- Poor bug reports waste **30–40% of developer debugging time**
- Missing steps, vague descriptions, and no environment info delay fixes
- No standard tool existed to **score and improve** defect reports before filing
- Manual QA review is **inconsistent** and time-consuming
- Developers often send reports back to QA for more info — wasting both teams' time

---

## SLIDE 3 — Solution: What is BugLens?

BugLens automatically analyzes a bug report and:

- ✅ Gives it a **quality score out of 100**
- ✅ Flags **missing or weak fields** instantly
- ✅ Suggests **AI-powered improvements**
- ✅ **Rewrites the report** professionally
- ✅ **Detects exception types** from stack traces (TypeError, NullPointer, HTTP 5xx, etc.)
- ✅ Recommends which team should be assigned (Frontend / Backend / DevOps / DB)
- ✅ Estimates fix effort (Hours / Days / Weeks)

---

## SLIDE 4 — Agile Methodology ⭐ KEY SLIDE

**We followed a 4-Sprint Agile Development Cycle**

| Sprint | Goal | Deliverable |
|--------|------|-------------|
| Sprint 1 | Project Setup & Design System | Login page, CSS design tokens, color palette, typography |
| Sprint 2 | Core Analyzer Feature | 12-field bug report form, live completeness bar, rule-based scoring engine |
| Sprint 3 | Results & History Module | Score ring, 7-section breakdown, downloads (TXT/MD/HTML/JSON), history view |
| Sprint 4 | Compare, Dashboard & Signup | Analytics dashboard, side-by-side compare, user signup, 20 sample reports |

**Agile Practices Applied:**
- ✅ **Iterative Delivery** — working software delivered at end of every sprint
- ✅ **MVP-First Approach** — core analyzer built before additional features
- ✅ **Continuous Improvement** — features refined based on feedback each sprint
- ✅ **Incremental Features** — signup, samples, dashboard added progressively
- ✅ **Sprint Reviews** — each sprint had a clear goal and measurable deliverable

---

## SLIDE 5 — Technology Stack

| Layer | Technology | GitHub Location |
|-------|-----------|-----------------|
| **Frontend** | React 19 | `artifacts/buglens/src/` |
| **Backend** | Node.js 24 + Express 5 | `artifacts/api-server/src/` |
| **Build Tool** | Vite 7 (runs on Node.js) | `artifacts/buglens/vite.config.ts` |
| **Language** | TypeScript 5.9 | All `.ts` and `.tsx` files |
| **Styling** | Custom CSS + Tailwind CSS | `artifacts/buglens/src/index.css` |
| **AI Engine** | Anthropic Claude API | `artifacts/buglens/src/lib/analysis.ts` |
| **Storage** | localStorage (browser) | `artifacts/buglens/src/lib/store.ts` |
| **Package Manager** | pnpm (Node.js) | `package.json` (root) |
| **Hosting** | Replit Cloud | Live `.replit.app` domain |

**Usage Split:**
- React → **70%** (all UI, pages, components, state management)
- Node.js → **30%** (API server, runtime, build tooling, package management)

---

## SLIDE 6 — Project File Structure on GitHub

```
BugLens-Defect-Quality-Checker/
│
├── artifacts/
│   │
│   ├── buglens/                  ← REACT APP (Frontend)
│   │   └── src/
│   │       ├── App.tsx           ← Main React entry point
│   │       ├── index.css         ← Full design system
│   │       ├── main.tsx          ← React DOM render root
│   │       ├── pages/            ← 6 page components
│   │       │   ├── LoginPage.tsx
│   │       │   ├── AnalyzerPage.tsx
│   │       │   ├── ResultsPanel.tsx
│   │       │   ├── HistoryPage.tsx
│   │       │   ├── ComparePage.tsx
│   │       │   └── DashboardPage.tsx
│   │       ├── components/       ← Reusable components
│   │       │   ├── Navbar.tsx
│   │       │   ├── ScoreRing.tsx
│   │       │   └── Toast.tsx
│   │       └── lib/              ← Business logic
│   │           ├── analysis.ts   ← Scoring engine + AI
│   │           ├── samples.ts    ← 20 sample bug reports
│   │           ├── store.ts      ← Auth + history state
│   │           └── types.ts      ← TypeScript interfaces
│   │
│   └── api-server/               ← NODE.JS SERVER (Backend)
│       └── src/
│           ├── index.ts          ← Node.js server entry
│           ├── app.ts            ← Express app setup
│           ├── routes/           ← API route handlers
│           └── middlewares/      ← Logging, error handling
│
└── package.json                  ← Root Node.js workspace config
```

---

## SLIDE 7 — Scoring System

**7 Sections Scored Out of 100:**

| Section | Max Points | What is Evaluated |
|---------|-----------|-------------------|
| Bug Title | 20 pts | Clarity, length, specificity |
| Description | 20 pts | Detail, user impact, frequency |
| Steps to Reproduce | 20 pts | Numbered steps, completeness |
| Expected / Actual Result | 15 pts | Both sides present, clarity |
| Environment | 15 pts | OS, browser, app version |
| Severity | 5 pts | Set or not |
| Attachments | 5 pts | Screenshots, logs, videos |
| **Total** | **100 pts** | |

**Grade Bands:**
- 🟢 **90–100** → Excellent (Ready for development)
- 🔵 **75–89** → Good (Minor gaps)
- 🟡 **55–74** → Needs Work (Improvement required)
- 🔴 **0–54** → Incomplete (Key info missing)

---

## SLIDE 8 — Key Features (5 Modules)

**Module 1 — Analyzer**
- 12-field bug report form
- Real-time completeness bar with color-coded tags
- Accepts any input — random text, partial reports, or complete reports

**Module 2 — Results Dashboard**
- Animated SVG score ring
- 7-section score breakdown cards
- Exception type detection (TypeError, NullPointer, HTTP 5xx, CORS, Timeout, etc.)
- AI suggestions and professional rewrite
- Download as TXT, Markdown, HTML, JSON

**Module 3 — History**
- Per-user analysis history (up to 50 reports)
- View any past report in modal
- Download individual reports
- Export all history as CSV

**Module 4 — Compare**
- Select any 2 reports side-by-side
- Section-by-section dual bar charts
- Winner badge for higher-scored report

**Module 5 — Dashboard**
- Total analyses, average score, passing count, critical count
- Score trend spark chart (last 20 reports)
- Grade distribution bar chart
- Recommended assignee breakdown

---

## SLIDE 9 — User Roles & Signup

**Built-in Demo Accounts:**

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| QA Lead | qa_lead | qa1234 |
| Developer | dev_user | dev5678 |
| Analyst | analyst | pass2024 |

**Signup Feature:**
- New users can create their own account
- Requires: Full Name, Username (min 3 chars), Password (min 6 chars), Role
- Accounts saved securely in browser localStorage
- Each user has their own private analysis history

---

## SLIDE 10 — Sample Reports (20 Real-World Scenarios)

The app includes 20 sample bug reports spanning:

1. Search page crash on special characters
2. Login button unresponsive (Safari + 2FA)
3. Checkout total shows $0.00 with promo code
4. Profile photo upload fails silently (PNG > 2MB)
5. Dashboard date filter resets on refresh
6. Bulk email freezes browser (500+ recipients)
7. PDF export generates blank chart pages
8. API rate limiter returns 200 instead of 429
9. Email images broken in dark mode
10. Kanban drag-drop clears assignee on Firefox
11. iOS app crashes offline (iOS 17)
12. Invoice rounding error over $10,000
13. Autocomplete overlay blocks mobile form submit
14. Database connection pool exhausted under load
15. CSV import fails for UTF-8 BOM files
16. WebSocket disconnects in corporate proxy
17. Password reset link expires immediately (timezone bug)
18. RBAC allows viewers to delete via API
19. Infinite scroll fires duplicate API calls
20. Dark mode resets on every page navigation

**Each click of "Load Sample" picks a random one from these 20.**

---

## SLIDE 11 — Deployment & GitHub

**Live Application:**
- Hosted on Replit Cloud
- HTTPS enabled automatically
- Available on `.replit.app` domain

**Source Code:**
- GitHub: `github.com/9harshithp/BugLens-Defect-Quality-Checker`
- Pushed via Git with Personal Access Token authentication

**No database required:**
- Fully client-side application
- Zero server infrastructure costs
- All data stored in browser localStorage

---

## SLIDE 12 — Conclusion

> BugLens proves that **Agile iterative development** delivers real, working software sprint by sprint — starting from a login screen and ending with a full AI-powered enterprise quality platform in just **4 sprints**.

**Key Takeaways:**
- Better bug reports = Faster developer fixes = Higher software quality
- React handles the full user experience (70% of codebase)
- Node.js powers the backend runtime and API server (30% of codebase)
- Agile ensured every sprint produced a working, demonstrable deliverable
- The product is live, deployed, and accessible to anyone with the URL

---

*Prepared for academic presentation | BugLens Project | 2025*
