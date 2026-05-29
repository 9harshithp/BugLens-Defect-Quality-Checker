import type { AnalysisResult, ExceptionMatch, GradeMeta } from './types';

export function scoreColor(s: number): string {
  return s >= 80 ? '#1d6b4e' : s >= 60 ? '#b5830a' : '#c4410c';
}

export function gradeMeta(s: number): GradeMeta {
  if (s >= 90) return { label: 'Excellent',   bg: '#e8f5f0', color: '#1d6b4e' };
  if (s >= 75) return { label: 'Good',         bg: '#e8f0fa', color: '#1e4b8a' };
  if (s >= 55) return { label: 'Needs Work',   bg: '#fef8e8', color: '#b5830a' };
  return             { label: 'Incomplete',    bg: '#fef2ee', color: '#c4410c' };
}

export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  const h = Math.floor(d / 3600000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

/* ── Content Quality Gate ────────────────────────────────────────────────
   Returns:
     'empty' → nothing meaningful was typed (blank / whitespace only) → score 0
     'junk'  → repeated/single-char padding (e.g. "AAAA", spaces) → score 1
     'ok'    → real content → normal length-based scoring
   ──────────────────────────────────────────────────────────────────────── */
export type ContentQuality = 'empty' | 'junk' | 'ok';

export function contentQuality(raw: string): ContentQuality {
  const t = raw.trim();
  if (!t) return 'empty';

  // Strip all whitespace to check actual character diversity
  const chars = t.replace(/\s+/g, '').toLowerCase();
  if (!chars) return 'empty'; // only whitespace

  const unique = new Set(chars).size;
  const len = t.length;

  // Single repeated character: "AAAAAAA", "111111", "......"
  if (unique === 1) return 'junk';

  // Very low diversity relative to length
  if (len >= 6  && unique <= 2) return 'junk';   // "ABABAB", "aabbbb"
  if (len >= 20 && unique <= 3) return 'junk';   // "ABCABCABCABCABC..."
  if (len >= 40 && unique <= 4) return 'junk';   // long strings with ≤4 distinct chars

  return 'ok';
}

/* ── Scoring helpers (trim + quality-gated) ─────────────────────────── */

function scoreTitle(raw: string): number {
  const t = raw.trim();
  const q = contentQuality(t);
  if (q === 'empty') return 0;
  if (q === 'junk')  return 1;
  const len = t.length;
  if (len <= 8)  return 4;
  if (len <= 20) return 8;
  if (len <= 35) return 13;
  if (len <= 60) return 17;
  return 20;
}

function scoreDesc(raw: string): number {
  const t = raw.trim();
  const q = contentQuality(t);
  if (q === 'empty') return 0;
  if (q === 'junk')  return 1;
  const len = t.length;
  if (len <= 20)  return 4;
  if (len <= 80)  return 8;
  if (len <= 150) return 13;
  if (len <= 300) return 17;
  return 20;
}

function scoreSteps(raw: string): number {
  const t = raw.trim();
  const q = contentQuality(t);
  if (q === 'empty') return 0;
  if (q === 'junk')  return 1;
  const len = t.length;
  const stepLines = (t.match(/\n/g) || []).length;
  if (len <= 15)                        return 4;
  if (len > 100 && stepLines >= 4)      return 20;
  if (len > 60  && stepLines >= 2)      return 17;
  if (len > 30  && t.includes('\n'))    return 13;
  if (len > 30)                         return 8;
  return 4;
}

function scoreExpAct(expRaw: string, actRaw: string): number {
  const expT = expRaw.trim();
  const actT = actRaw.trim();
  const expQ = contentQuality(expT);
  const actQ = contentQuality(actT);
  const expLen = expQ === 'ok' ? expT.length : 0;
  const actLen = actQ === 'ok' ? actT.length : 0;
  const expJunk = expQ === 'junk';
  const actJunk = actQ === 'junk';

  if (expQ === 'empty' && actQ === 'empty') return 0;
  if (expJunk && actJunk) return 1;
  if ((expLen > 20 && actLen > 20) || (expLen > 20 && actJunk) || (actLen > 20 && expJunk)) {
    // at least one side is detailed
    if (expLen > 20 && actLen > 20) return 15;
    return 7;
  }
  if (expLen > 0 && actLen > 0)   return 11;
  if (expLen > 20 || actLen > 20) return 7;
  if (expLen > 0 || actLen > 0 || expJunk || actJunk) return 4;
  return 0;
}

function scoreEnv(raw: string): number {
  const t = raw.trim();
  const q = contentQuality(t);
  if (q === 'empty') return 0;
  if (q === 'junk')  return 1;
  const len = t.length;
  if (len <= 10) return 4;
  if (len <= 25) return 8;
  if (len <= 50) return 12;
  return 15;
}

function scoreAtt(raw: string): number {
  const t = raw.trim();
  const q = contentQuality(t);
  if (q === 'empty') return 0;
  if (q === 'junk')  return 0;
  const len = t.length;
  if (len <= 10) return 1;
  if (len <= 30) return 3;
  return 5;
}

/* ── Live score (used for the progress bar while typing) ─────────────── */
export function computeLiveScore(
  title: string, desc: string, steps: string,
  exp: string, act: string, env: string, sev: string
): number {
  return (
    scoreTitle(title) +
    scoreDesc(desc) +
    scoreSteps(steps) +
    scoreExpAct(exp, act) +
    scoreEnv(env) +
    (sev ? 5 : 0)
  );
}

export function parseException(txt: string): ExceptionMatch[] {
  if (!txt) return [];
  const results: ExceptionMatch[] = [];
  const seen: Record<string, boolean> = {};
  const patterns: Array<{ re: RegExp; type: string; sev: 'critical' | 'warning' | 'info'; hint: string }> = [
    { re: /TypeError/i,           type: 'TypeError',          sev: 'critical', hint: 'Accessing a property on undefined or null. Ensure the object exists before use.' },
    { re: /ReferenceError/i,      type: 'ReferenceError',     sev: 'critical', hint: 'Variable is not defined. Check scope and declaration order.' },
    { re: /SyntaxError/i,         type: 'SyntaxError',        sev: 'critical', hint: 'Code has a syntax problem. Check for missing brackets, commas, or typos.' },
    { re: /NullPointerException/i,type: 'NullPointerException',sev: 'critical', hint: 'Java null dereference. Ensure the object is initialized before use.' },
    { re: /OutOfMemoryError/i,    type: 'OutOfMemoryError',   sev: 'critical', hint: 'Heap exhausted. Profile memory and look for leaks.' },
    { re: /StackOverflow/i,       type: 'StackOverflowError', sev: 'critical', hint: 'Infinite recursion. Check base conditions in recursive functions.' },
    { re: /HTTP\s*5\d\d/i,        type: 'HTTP 5xx Error',     sev: 'critical', hint: 'Server error. Check server logs, DB connections, and service health.' },
    { re: /HTTP\s*4\d\d/i,        type: 'HTTP 4xx Error',     sev: 'warning',  hint: 'Client error. Check request headers, auth tokens, and endpoint URLs.' },
    { re: /CORS/i,                type: 'CORS Error',         sev: 'warning',  hint: 'Cross-origin blocked. Check allowed-origins in API gateway config.' },
    { re: /timeout/i,             type: 'Timeout',            sev: 'warning',  hint: 'Request timed out. Check network latency and DB query performance.' },
    { re: /403/,                  type: '403 Forbidden',      sev: 'warning',  hint: 'Authorization denied. Verify user roles and permissions.' },
    { re: /404/,                  type: '404 Not Found',      sev: 'info',     hint: 'Resource not found. Check route config and data existence.' },
  ];
  for (const pat of patterns) {
    if (pat.re.test(txt) && !seen[pat.type]) {
      seen[pat.type] = true;
      results.push({ type: pat.type, sev: pat.sev, hint: pat.hint });
    }
  }
  return results;
}

/* ── Rule-based analysis (no API key required) ── */
export function ruleBasedAnalysis(fields: {
  title: string; desc: string; steps: string;
  exp: string; act: string; env: string;
  sev: string; pri: string; comp: string;
  rep: string; exc: string; att: string;
}): AnalysisResult {
  const { title, desc, steps, exp, act, env, sev } = fields;

  const tScore  = scoreTitle(title);
  const dScore  = scoreDesc(desc);
  const sScore  = scoreSteps(steps);
  const eaScore = scoreExpAct(exp, act);
  const envScore = scoreEnv(env);
  const sevScore = sev ? 5 : 0;
  const attScore = scoreAtt(fields.att);

  const overall = tScore + dScore + sScore + eaScore + envScore + sevScore + attScore;

  const alerts: AnalysisResult['missing_alerts'] = [];
  const suggestions: string[] = [];

  // ── Junk / whitespace detection alerts ──────────────────────────────
  const junkFields: Array<{ key: string; label: string; val: string }> = [
    { key: 'title', label: 'Bug Title', val: title },
    { key: 'desc',  label: 'Description', val: desc },
    { key: 'steps', label: 'Steps to Reproduce', val: steps },
    { key: 'exp',   label: 'Expected Result', val: exp },
    { key: 'act',   label: 'Actual Result',   val: act },
    { key: 'env',   label: 'Environment',     val: env },
  ];
  for (const f of junkFields) {
    const q = contentQuality(f.val);
    if (q === 'junk') {
      alerts.push({
        field: f.label,
        severity: 'critical',
        message: `"${f.label}" contains repeated or nonsense characters. Please provide meaningful information — this field scored 1/${f.key === 'env' ? 15 : f.key === 'exp' || f.key === 'act' ? 15 : 20}.`,
      });
    }
  }

  // ── Standard missing / weak field alerts ────────────────────────────
  const titleT = title.trim();
  const descT  = desc.trim();
  const stepsT = steps.trim();
  const expT   = exp.trim();
  const actT   = act.trim();
  const envT   = env.trim();

  if (!titleT) {
    alerts.push({ field: 'Bug Title',    severity: 'critical', message: 'A descriptive title is required. Include the component, action, and observed behavior.' });
  } else if (contentQuality(titleT) === 'ok' && titleT.length < 15) {
    alerts.push({ field: 'Bug Title', severity: 'warning', message: 'Title is too short. Add component name, environment, or specific failure detail.' });
  }

  if (!descT) {
    alerts.push({ field: 'Description',  severity: 'critical', message: 'Description is missing. Explain what is broken and its user impact.' });
  } else if (contentQuality(descT) === 'ok' && descT.length < 50) {
    alerts.push({ field: 'Description', severity: 'warning', message: 'Description is brief. Add frequency, impact scope, and failure pattern.' });
  }

  if (!stepsT) {
    alerts.push({ field: 'Steps to Reproduce', severity: 'critical', message: 'Reproduction steps are required. Number each step clearly.' });
  } else if (contentQuality(stepsT) === 'ok' && !stepsT.includes('\n')) {
    alerts.push({ field: 'Steps to Reproduce', severity: 'warning', message: 'Steps appear unnumbered. Format as 1. Step one\n2. Step two for clarity.' });
  }

  const expOk = contentQuality(expT) === 'ok';
  const actOk = contentQuality(actT) === 'ok';
  if (!expT && !actT) {
    alerts.push({ field: 'Expected / Actual Result', severity: 'critical', message: 'Both expected and actual results are needed to validate the fix.' });
  } else if (!expOk && expT) {
    // already caught by junk loop
  } else if (!expT) {
    alerts.push({ field: 'Expected Result', severity: 'warning', message: 'Missing expected behavior — add what should happen after the steps.' });
  } else if (!actT) {
    alerts.push({ field: 'Actual Result',   severity: 'warning', message: 'Missing actual behavior — describe what actually happened.' });
  }

  if (!envT)           alerts.push({ field: 'Environment',   severity: 'warning', message: 'No environment info. Add OS, browser, app version, and server/env name.' });
  if (!sev)            alerts.push({ field: 'Severity',      severity: 'info',    message: 'Severity not set. Helps triage and prioritization.' });
  if (!fields.att.trim()) alerts.push({ field: 'Attachments', severity: 'info',   message: 'No attachments. Screenshots, logs, or screen recordings speed up diagnosis.' });

  // ── Suggestions ─────────────────────────────────────────────────────
  if (contentQuality(titleT) === 'ok' && titleT.length > 0)
    suggestions.push(`Consider refining the title to follow the pattern: "[Component] [Action] [Failure]" — e.g. "${titleT.split(' ').slice(0,3).join(' ')} on [Platform/Version]".`);
  if (contentQuality(descT) === 'ok' && descT.length > 0 && descT.length < 200)
    suggestions.push('Expand the description to include: frequency (does this happen every time?), affected user segment, and whether it regressed recently.');
  if (contentQuality(stepsT) === 'ok' && stepsT.length > 0)
    suggestions.push('Add a prerequisite state before step 1 (e.g. "User must be logged in as Admin") to make reproduction deterministic.');
  suggestions.push('Include a test case hint: GIVEN [precondition] WHEN [action] THEN [expected outcome] — this directly maps to an automated test.');
  suggestions.push('Reference any related tickets or PRs that may have introduced this regression to help developers narrow scope quickly.');

  const rewrite = buildRewrite(fields, gradeMeta(overall).label);

  const riskLevel: AnalysisResult['risk_level'] =
    (sev === 'Critical' || sev === 'High' || overall < 55) ? 'High' :
    (sev === 'Medium' || overall < 75) ? 'Medium' : 'Low';

  const effort: AnalysisResult['estimated_fix_effort'] =
    fields.exc.includes('OutOfMemory') || fields.exc.includes('StackOverflow') ? 'Days' :
    sev === 'Critical' ? 'Hours' : 'Days';

  const assignee = guessAssignee(fields);

  const excAnalysis = fields.exc
    ? `The error trace indicates a ${parseException(fields.exc)[0]?.type ?? 'runtime exception'} originating at the described step. The root cause likely involves missing null/undefined guards or invalid state transitions. Recommend reviewing the relevant module with added defensive checks and unit tests covering the edge case.`
    : 'No exception provided.';

  const testHint = (expOk && actOk)
    ? `GIVEN a user is on the affected screen AND the preconditions are met, WHEN the described action is performed, THEN ${expT || 'the expected behavior should occur'}`
    : `GIVEN [preconditions], WHEN [trigger action from steps], THEN [expected result]`;

  return {
    overall_score: overall,
    section_scores: {
      title: tScore, description: dScore, steps: sScore,
      expected_actual: eaScore, environment: envScore,
      severity: sevScore, attachments: attScore,
    },
    missing_alerts: alerts,
    suggestions: suggestions.slice(0, 4),
    exception_analysis: excAnalysis,
    risk_level: riskLevel,
    estimated_fix_effort: effort,
    recommended_assignee: assignee,
    test_case_hint: testHint,
    rewritten_report: rewrite,
  };
}

function guessAssignee(fields: { comp: string; exc: string; sev: string }): string {
  const comp = fields.comp.toLowerCase();
  const exc  = fields.exc.toLowerCase();
  if (comp.includes('auth') || comp.includes('login') || comp.includes('session')) return 'Backend';
  if (comp.includes('ui') || comp.includes('frontend') || comp.includes('css')) return 'Frontend';
  if (comp.includes('db') || comp.includes('database') || comp.includes('sql')) return 'Database';
  if (comp.includes('deploy') || comp.includes('infra') || comp.includes('ci')) return 'DevOps';
  if (exc.includes('sql') || exc.includes('postgres') || exc.includes('mongo')) return 'Database';
  if (exc.includes('cors') || exc.includes('network') || exc.includes('502')) return 'DevOps';
  return 'Backend';
}

function buildRewrite(fields: {
  title: string; desc: string; steps: string;
  exp: string; act: string; env: string;
  sev: string; pri: string; comp: string;
  rep: string; exc: string; att: string;
}, grade: string): string {
  const { title, desc, steps, exp, act, env, sev, pri, comp, rep, exc, att } = fields;
  const lines: string[] = [
    `TITLE: ${title || '[No title provided]'}`,
    ``,
    `DESCRIPTION:`,
    desc || '[No description provided]',
    ``,
    `STEPS TO REPRODUCE:`,
    steps || '[No steps provided]',
    ``,
    `EXPECTED RESULT:`,
    exp || '[No expected result provided]',
    ``,
    `ACTUAL RESULT:`,
    act || '[No actual result provided]',
    ``,
    `ENVIRONMENT:`,
    env || '[No environment details provided — ASSUMED: latest production build]',
    ``,
    `SEVERITY: ${sev || '[Not set]'}`,
    `PRIORITY: ${pri || '[Not set]'}`,
    `COMPONENT: ${comp || '[Not specified]'}`,
    `REPORTER: ${rep || '[Not specified]'}`,
    ``,
    `EXCEPTION / STACK TRACE:`,
    exc || 'None provided.',
    ``,
    `ATTACHMENTS:`,
    att || 'None provided.',
    ``,
    `── QA ANALYSIS ─────────────────────────────`,
    `Quality Grade: ${grade}`,
    exc ? `Exception Type: ${parseException(exc).map(e => e.type).join(', ') || 'Unknown'}` : '',
  ].filter(l => l !== undefined);
  return lines.join('\n');
}

/* ── AI-powered analysis via Anthropic API ── */
export async function aiAnalysis(
  fields: {
    title: string; desc: string; steps: string;
    exp: string; act: string; env: string;
    sev: string; pri: string; comp: string;
    rep: string; exc: string; att: string;
  },
  apiKey: string
): Promise<AnalysisResult> {
  const report = Object.entries({
    'Bug Title': fields.title, 'Description': fields.desc,
    'Steps to Reproduce': fields.steps, 'Expected Result': fields.exp,
    'Actual Result': fields.act, 'Environment': fields.env,
    'Severity': fields.sev, 'Priority': fields.pri,
    'Component': fields.comp, 'Reporter': fields.rep,
    'Exception/Error': fields.exc, 'Attachments': fields.att,
  }).map(([k, v]) => `${k}: ${v || '(not provided)'}`).join('\n');

  const prompt = `You are a senior QA engineer. Analyze this defect report and return ONLY valid JSON with no markdown or backticks.\n\nREPORT:\n${report}\n\nReturn exactly this JSON:\n{\n  "overall_score": <0-100>,\n  "section_scores": {"title":<0-20>,"description":<0-20>,"steps":<0-20>,"expected_actual":<0-15>,"environment":<0-15>,"severity":<0-5>,"attachments":<0-5>},\n  "missing_alerts": [{"field":"<name>","severity":"critical|warning|info","message":"<actionable>"}],\n  "suggestions": ["<suggestion 1>","<suggestion 2>","<suggestion 3>"],\n  "exception_analysis": "<2-3 sentence root cause hypothesis>",\n  "risk_level": "High|Medium|Low",\n  "estimated_fix_effort": "Hours|Days|Weeks",\n  "recommended_assignee": "Frontend|Backend|DevOps|QA|Database|Unknown",\n  "test_case_hint": "<GIVEN ... WHEN ... THEN ...>",\n  "rewritten_report": "<Full professional rewrite with headers: TITLE:, DESCRIPTION:, STEPS TO REPRODUCE:, EXPECTED RESULT:, ACTUAL RESULT:, ENVIRONMENT:, SEVERITY:, PRIORITY:, COMPONENT:, EXCEPTION:, ATTACHMENTS:, TEST CASE:>"\n}\nReturn ONLY the JSON.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const raw = (data.content || []).map((b: { text?: string }) => b.text || '').join('');
  const clean = raw.replace(/```json|```/g, '').trim();
  const si = clean.indexOf('{'), ei = clean.lastIndexOf('}');
  return JSON.parse(clean.slice(si, ei + 1)) as AnalysisResult;
}
