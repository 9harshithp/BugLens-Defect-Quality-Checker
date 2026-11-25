# BugLens v2.0 — Defect Quality Intelligence Platform

> Turning confusion into clarity.

[![CI](https://github.com/9harshithp/BugLens-Defect-Quality-Checker/actions/workflows/ci.yml/badge.svg)](https://github.com/9harshithp/BugLens-Defect-Quality-Checker/actions/workflows/ci.yml)

BugLens is an intelligent software defect quality analysis platform that evaluates bug reports before they reach engineering teams. It scores completeness against a 100-point rubric, detects meaningless or incomplete content, classifies defects, analyzes exceptions with diagnostic hypotheses, generates Gherkin BDD scenarios, detects duplicate reports, and tracks quality trends.

## Key Capabilities

- **100-Point Quality Scoring Rubric**: Title (20), Description (20), Steps to Reproduce (20), Expected & Actual Results (15), Environment (15), Severity (5), Attachments (5), with per-section explanations and `Excellent` / `Good` / `Needs Improvement` / `Incomplete` grades.
- **Dual Analysis Engine**: Deterministic, offline-capable rule-based engine by default, plus optional server-proxied AI enhancement (`POST /api/analyze/ai`) with Zod validation and automatic rule-based fallback.
- **Defect Classification Engine**: Automatic (and user-editable) classification across 11 categories (`Functional`, `UI/UX`, `Performance`, `API`, `Database`, `Authentication`, `Compatibility`, `Integration`, `Configuration`, `Accessibility`, `Regression`).
- **Exception & Error Analysis**: Parses `TypeError`, `ReferenceError`, `SyntaxError`, `NullPointerException`, `OutOfMemoryError`, `StackOverflowError`, HTTP 4xx/5xx, CORS, Timeout, Database, Dependency, and Configuration errors into hypotheses, confidence levels, recommended teams, and diagnostic questions.
- **Professional Defect Report & BDD Generator**: Standardized, editable `DEFECT REPORT` output and categorized Gherkin scenarios (`Positive`, `Negative`, `Boundary`, `Regression`).
- **Duplicate Detection & Side-by-Side Comparison**: Detects similar historical defects and compares two reports with score deltas and section breakdowns.
- **PostgreSQL Persistence & Session Auth**: Express 5 REST API with `scrypt` password hashing, `HttpOnly` cookie sessions, rate limiting, and Drizzle ORM persistence (`users`, `sessions`, `defect_reports`, `analyses`, `section_scores`, `recommendations`, `test_cases`).
- **Multi-Format Exports**: TXT, Markdown, HTML, JSON, CSV, and printable PDF.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js 24, Express 5, Zod, Pino
- **Database**: PostgreSQL, Drizzle ORM
- **Testing**: Vitest, React Testing Library

## Local Development Setup

### 1. Install dependencies
```bash
pnpm install --config.strict-dep-builds=false
```

### 2. Provision PostgreSQL and push schema
```bash
export DATABASE_URL="postgresql://buglens:buglens@localhost:5432/buglens"
pnpm --filter @workspace/db run push
```

### 3. Run the backend API server
```bash
PORT=5050 DATABASE_URL="postgresql://buglens:buglens@localhost:5432/buglens" pnpm --filter @workspace/api-server run dev
```

### 4. Run the frontend dev server
```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/buglens run dev
```

### Optional Environment Variables
- `ANTHROPIC_API_KEY`: Enables server-side AI report enhancement in `POST /api/analyze/ai` (falls back automatically to rule-based analysis when unset).

## Verification & Testing

```bash
# Typecheck
pnpm run typecheck:libs
pnpm --filter @workspace/buglens run typecheck
pnpm --filter @workspace/api-server run typecheck

# Unit & component tests
pnpm --filter @workspace/buglens run test

# Production builds
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/buglens run build
pnpm --filter @workspace/api-server run build
```

