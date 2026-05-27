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

export function computeLiveScore(
  title: string, desc: string, steps: string,
  exp: string, act: string, env: string, sev: string
): number {
  // Title — max 20
  const tScore =
    title.length === 0 ? 0 :
    title.length <= 8 ? 4 :
    title.length <= 20 ? 8 :
    title.length <= 35 ? 13 :
    title.length <= 60 ? 17 : 20;

  // Description — max 20
  const dScore =
    desc.length === 0 ? 0 :
    desc.length <= 20 ? 4 :
    desc.length <= 80 ? 8 :
    desc.length <= 150 ? 13 :
    desc.length <= 300 ? 17 : 20;

  // Steps — max 20
  const stepLines = (steps.match(/\n/g) || []).length;
  const sScore =
    steps.length === 0 ? 0 :
    steps.length <= 15 ? 4 :
    steps.length > 100 && stepLines >= 4 ? 20 :
    steps.length > 60 && stepLines >= 2 ? 17 :
    steps.length > 30 && steps.includes('\n') ? 13 :
    steps.length > 30 ? 8 : 4;

  // Expected + Actual — max 15
  const expLen = exp.trim().length;
  const actLen = act.trim().length;
  const eaScore =
    (expLen > 20 && actLen > 20) ? 15 :
    (expLen > 0 && actLen > 0) ? 11 :
    (expLen > 20 || actLen > 20) ? 7 :
    (expLen > 0 || actLen > 0) ? 4 : 0;

  // Environment — max 15
  const envScore =
    env.length === 0 ? 0 :
    env.length <= 10 ? 4 :
    env.length <= 25 ? 8 :
    env.length <= 50 ? 12 : 15;

  // Severity — max 5
  const sevScore = sev ? 5 : 0;

  return tScore + dScore + sScore + eaScore + envScore + sevScore;
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
  const { title, desc, steps, exp, act, env, sev, att } = fields;

  // Title — max 20 pts
  // 20: long, specific (>60 chars), 17: descriptive (>35), 13: adequate (>20), 8: short (>10), 4: minimal, 0: empty
  const tScore =
    title.length === 0 ? 0 :
    title.length <= 8 ? 4 :
    title.length <= 20 ? 8 :
    title.length <= 35 ? 13 :
    title.length <= 60 ? 17 : 20;

  // Description — max 20 pts
  // 20: very detailed (>300), 17: detailed (>150), 13: moderate (>80), 8: brief (>30), 4: minimal, 0: empty
  const dScore =
    desc.length === 0 ? 0 :
    desc.length <= 20 ? 4 :
    desc.length <= 80 ? 8 :
    desc.length <= 150 ? 13 :
    desc.length <= 300 ? 17 : 20;

  // Steps — max 20 pts
  // 20: numbered multi-step (>100 chars + \n), 17: multi-line (>60 + \n), 13: some lines (>30 + \n), 8: single block (>30), 4: minimal, 0: empty
  const stepLines = (steps.match(/\n/g) || []).length;
  const sScore =
    steps.length === 0 ? 0 :
    steps.length <= 15 ? 4 :
    steps.length > 100 && stepLines >= 4 ? 20 :
    steps.length > 60 && stepLines >= 2 ? 17 :
    steps.length > 30 && steps.includes('\n') ? 13 :
    steps.length > 30 ? 8 : 4;

  // Expected + Actual — max 15 pts
  // 15: both present and detailed (>20 each), 11: both present, 7: one detailed, 4: one brief, 0: neither
  const expLen = exp.trim().length;
  const actLen = act.trim().length;
  const eaScore =
    (expLen > 20 && actLen > 20) ? 15 :
    (expLen > 0 && actLen > 0) ? 11 :
    (expLen > 20 || actLen > 20) ? 7 :
    (expLen > 0 || actLen > 0) ? 4 : 0;

  // Environment — max 15 pts
  // 15: very detailed (>50), 12: good (>25), 8: basic (>10), 4: minimal, 0: empty
  const envScore =
    env.length === 0 ? 0 :
    env.length <= 10 ? 4 :
    env.length <= 25 ? 8 :
    env.length <= 50 ? 12 : 15;

  // Severity — max 5 pts
  const sevScore = sev ? 5 : 0;

  // Attachments — max 5 pts
  // 5: multiple or detailed (>30), 3: something (>10), 1: minimal, 0: empty
  const attScore =
    att.length === 0 ? 0 :
    att.length <= 10 ? 1 :
    att.length <= 30 ? 3 : 5;

  const overall = tScore + dScore + sScore + eaScore + envScore + sevScore + attScore;

  const alerts: AnalysisResult['missing_alerts'] = [];
  const suggestions: string[] = [];

  if (!title)         alerts.push({ field: 'Bug Title',    severity: 'critical', message: 'A descriptive title is required. Include the component, action, and observed behavior.' });
  else if (title.length < 15) alerts.push({ field: 'Bug Title', severity: 'warning', message: 'Title is too short. Add component name, environment, or specific failure detail.' });

  if (!desc)          alerts.push({ field: 'Description',  severity: 'critical', message: 'Description is missing. Explain what is broken and its user impact.' });
  else if (desc.length < 50) alerts.push({ field: 'Description', severity: 'warning', message: 'Description is brief. Add frequency, impact scope, and failure pattern.' });

  if (!steps)         alerts.push({ field: 'Steps to Reproduce', severity: 'critical', message: 'Reproduction steps are required. Number each step clearly.' });
  else if (!steps.includes('\n')) alerts.push({ field: 'Steps to Reproduce', severity: 'warning', message: 'Steps appear unnumbered. Format as 1. Step one\n2. Step two for clarity.' });

  if (!exp && !act)   alerts.push({ field: 'Expected / Actual Result', severity: 'critical', message: 'Both expected and actual results are needed to validate the fix.' });
  else if (!exp)      alerts.push({ field: 'Expected Result', severity: 'warning', message: 'Missing expected behavior — add what should happen after the steps.' });
  else if (!act)      alerts.push({ field: 'Actual Result',   severity: 'warning', message: 'Missing actual behavior — describe what actually happened.' });

  if (!env)           alerts.push({ field: 'Environment',   severity: 'warning', message: 'No environment info. Add OS, browser, app version, and server/env name.' });
  if (!sev)           alerts.push({ field: 'Severity',      severity: 'info',    message: 'Severity not set. Helps triage and prioritization.' });
  if (!att)           alerts.push({ field: 'Attachments',   severity: 'info',    message: 'No attachments. Screenshots, logs, or screen recordings speed up diagnosis.' });

  if (title.length > 0) suggestions.push(`Consider refining the title to follow the pattern: "[Component] [Action] [Failure]" — e.g. "${title.split(' ').slice(0,3).join(' ')} on [Platform/Version]".`);
  if (desc.length > 0 && desc.length < 200) suggestions.push('Expand the description to include: frequency (does this happen every time?), affected user segment, and whether it regressed recently.');
  if (steps.length > 0) suggestions.push('Add a prerequisite state before step 1 (e.g. "User must be logged in as Admin") to make reproduction deterministic.');
  suggestions.push('Include a test case hint: GIVEN [precondition] WHEN [action] THEN [expected outcome] — this directly maps to an automated test.');
  suggestions.push('Reference any related tickets or PRs that may have introduced this regression to help developers narrow scope quickly.');

  // Generate a professional rewrite
  const rewrite = buildRewrite(fields, gradeMeta(overall).label);

  // Risk & effort heuristics
  const riskLevel: AnalysisResult['risk_level'] =
    (sev === 'Critical' || sev === 'High' || overall < 55) ? 'High' :
    (sev === 'Medium' || overall < 75) ? 'Medium' : 'Low';

  const effort: AnalysisResult['estimated_fix_effort'] =
    fields.exc.includes('OutOfMemory') || fields.exc.includes('StackOverflow') ? 'Days' :
    sev === 'Critical' ? 'Hours' : sev === 'High' ? 'Days' : 'Days';

  const assignee = guessAssignee(fields);

  const excAnalysis = fields.exc
    ? `The error trace indicates a ${parseException(fields.exc)[0]?.type ?? 'runtime exception'} originating at the described step. The root cause likely involves missing null/undefined guards or invalid state transitions. Recommend reviewing the relevant module with added defensive checks and unit tests covering the edge case.`
    : 'No exception provided.';

  const testHint = (exp && act)
    ? `GIVEN a user is on the affected screen AND the preconditions are met, WHEN the described action is performed, THEN ${exp || 'the expected behavior should occur'}`
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
