import type {
  AnalysisResult,
  DefectCategory,
  DefectClassification,
  DefectFields,
  DuplicateMatch,
  ExceptionMatch,
  GeneratedTestCase,
  GradeMeta,
  HistoryItem,
  SectionExplanations,
  SectionScores,
} from './types';

export function scoreColor(s: number): string {
  return s >= 80 ? '#1d6b4e' : s >= 60 ? '#b5830a' : '#c4410c';
}

export function gradeMeta(s: number): GradeMeta {
  if (s >= 90) return { label: 'Excellent',         bg: '#e8f5f0', color: '#1d6b4e' };
  if (s >= 75) return { label: 'Good',              bg: '#e8f0fa', color: '#1e4b8a' };
  if (s >= 55) return { label: 'Needs Improvement', bg: '#fef8e8', color: '#b5830a' };
  return             { label: 'Incomplete',         bg: '#fef2ee', color: '#c4410c' };
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

export type ContentQuality = 'empty' | 'junk' | 'ok';

export function contentQuality(raw: string): ContentQuality {
  const t = raw.trim();
  if (!t) return 'empty';

  const chars = t.replace(/\s+/g, '').toLowerCase();
  if (!chars) return 'empty';

  const unique = new Set(chars).size;
  const len = t.length;

  if (unique === 1) return 'junk';
  if (len >= 6  && unique <= 2) return 'junk';
  if (len >= 20 && unique <= 3) return 'junk';
  if (len >= 40 && unique <= 4) return 'junk';

  const letters = (chars.match(/[a-z]/g) || []).length;
  if (letters >= 15) {
    const vowels = (chars.match(/[aeiou]/g) || []).length;
    if (vowels / letters < 0.12) return 'junk';
  }

  return 'ok';
}

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
  if (len <= 15)                   return 4;
  if (len > 100 && stepLines >= 4) return 20;
  if (len > 60  && stepLines >= 2) return 17;
  if (len > 30  && t.includes('\n')) return 13;
  if (len > 30)                    return 8;
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

function explainSections(fields: DefectFields, scores: SectionScores): SectionExplanations {
  const tQ = contentQuality(fields.title);
  const dQ = contentQuality(fields.desc);
  const sQ = contentQuality(fields.steps);
  const eQ = contentQuality(fields.env);
  const expQ = contentQuality(fields.exp);
  const actQ = contentQuality(fields.act);
  const attQ = contentQuality(fields.att);

  const titleExp =
    tQ === 'empty' ? '0/20: Title is missing.' :
    tQ === 'junk' ? '1/20: Low-diversity or gibberish input detected.' :
    scores.title === 20 ? '20/20: Specific, descriptive title (>60 chars).' :
    `${scores.title}/20: Add component, action, and platform detail for full marks.`;

  const descExp =
    dQ === 'empty' ? '0/20: Description is missing.' :
    dQ === 'junk' ? '1/20: Low-diversity or gibberish input detected.' :
    scores.description === 20 ? '20/20: Thorough description (>300 chars) with clear context.' :
    `${scores.description}/20: Expand with user impact, frequency, and regression context.`;

  const stepsExp =
    sQ === 'empty' ? '0/20: Reproduction steps are missing.' :
    sQ === 'junk' ? '1/20: Low-diversity or gibberish input detected.' :
    scores.steps === 20 ? '20/20: Clear multi-line numbered steps (>4 lines).' :
    `${scores.steps}/20: Use 4+ numbered lines with preconditions for full marks.`;

  const expActExp =
    expQ === 'empty' && actQ === 'empty' ? '0/15: Both Expected and Actual results are missing.' :
    expQ === 'junk' || actQ === 'junk' ? `${scores.expected_actual}/15: Nonsense text detected in outcome fields.` :
    scores.expected_actual === 15 ? '15/15: Both Expected and Actual results are clearly detailed.' :
    `${scores.expected_actual}/15: Provide >20 chars in both Expected and Actual Result.`;

  const envExp =
    eQ === 'empty' ? '0/15: Environment details are missing.' :
    eQ === 'junk' ? '1/15: Low-diversity or gibberish input detected.' :
    scores.environment === 15 ? '15/15: Complete OS, browser, version, and environment details.' :
    `${scores.environment}/15: Include OS, browser/runtime version, app build, and stage.`;

  const sevExp = scores.severity === 5
    ? '5/5: Severity is specified for triage.'
    : '0/5: Severity is not selected.';

  const attExp =
    attQ === 'empty' ? '0/5: No attachments or log references provided.' :
    attQ === 'junk' ? '0/5: Invalid attachment text.' :
    scores.attachments === 5 ? '5/5: Supporting evidence/attachments referenced.' :
    `${scores.attachments}/5: Add links or references to screenshots, HAR, or logs.`;

  return {
    title: titleExp,
    description: descExp,
    steps: stepsExp,
    expected_actual: expActExp,
    environment: envExp,
    severity: sevExp,
    attachments: attExp,
  };
}

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
  if (!txt || !txt.trim()) return [];
  const results: ExceptionMatch[] = [];
  const seen = new Set<string>();

  const patterns: Array<{
    re: RegExp;
    type: string;
    category: string;
    sev: 'critical' | 'warning' | 'info';
    hypothesis: string;
    recommended_team: string;
    diagnostic_questions: string[];
    confidence: 'High' | 'Medium' | 'Low';
  }> = [
    {
      re: /TypeError/i,
      type: 'TypeError',
      category: 'Runtime / Type Safety',
      sev: 'critical',
      hypothesis: 'Hypothesis: A property or method may be accessed on an undefined or null reference, or a value has an unexpected type.',
      recommended_team: 'Frontend',
      diagnostic_questions: [
        'Is the offending object initialized before this execution path runs?',
        'Did an API response omit an optional field expected by the UI?',
      ],
      confidence: 'High',
    },
    {
      re: /ReferenceError/i,
      type: 'ReferenceError',
      category: 'Runtime / Scope',
      sev: 'critical',
      hypothesis: 'Hypothesis: An undeclared or out-of-scope identifier may be referenced during execution.',
      recommended_team: 'Frontend',
      diagnostic_questions: [
        'Was a variable renamed or removed without updating all call sites?',
        'Is a global or polyfill missing in this browser/runtime?',
      ],
      confidence: 'High',
    },
    {
      re: /SyntaxError/i,
      type: 'SyntaxError',
      category: 'Parser / Payload Format',
      sev: 'critical',
      hypothesis: 'Hypothesis: Malformed JSON, HTML returned instead of JSON, or invalid code syntax may be present.',
      recommended_team: 'Backend',
      diagnostic_questions: [
        'Did an API endpoint return an HTML error page when JSON was expected?',
        'Is the payload truncated or encoded improperly?',
      ],
      confidence: 'High',
    },
    {
      re: /NullPointerException/i,
      type: 'NullPointerException',
      category: 'Runtime / Null Dereference',
      sev: 'critical',
      hypothesis: 'Hypothesis: A null object reference may have been dereferenced in backend service logic.',
      recommended_team: 'Backend',
      diagnostic_questions: [
        'Which input or database lookup returned null at the failing line?',
        'Are null guards or Optional checks missing for edge-case inputs?',
      ],
      confidence: 'High',
    },
    {
      re: /OutOfMemoryError|heap out of memory/i,
      type: 'OutOfMemoryError',
      category: 'Resource / Memory',
      sev: 'critical',
      hypothesis: 'Hypothesis: Heap memory may be exhausted due to unbounded caching, large payloads, or retained object references.',
      recommended_team: 'Backend',
      diagnostic_questions: [
        'Does memory usage grow continuously under repeated requests?',
        'Is an unbounded dataset being loaded into memory without pagination?',
      ],
      confidence: 'High',
    },
    {
      re: /StackOverflow/i,
      type: 'StackOverflowError',
      category: 'Runtime / Recursion',
      sev: 'critical',
      hypothesis: 'Hypothesis: Unbounded recursion or circular state updates may be exhausting the call stack.',
      recommended_team: 'Backend',
      diagnostic_questions: [
        'Is there a missing termination condition in a recursive call or effect hook?',
        'Do two handlers trigger each other in a cycle?',
      ],
      confidence: 'High',
    },
    {
      re: /HTTP\s*5\d\d|\b50[0234]\b/i,
      type: 'HTTP 5xx Server Error',
      category: 'HTTP Server Error',
      sev: 'critical',
      hypothesis: 'Hypothesis: The server encountered an unhandled exception, upstream gateway failure, or service unavailability.',
      recommended_team: 'Backend',
      diagnostic_questions: [
        'What do the server application logs show for the matching request ID/timestamp?',
        'Is a downstream dependency or database unreachable?',
      ],
      confidence: 'High',
    },
    {
      re: /HTTP\s*4\d\d|\b40[01]\b|\b422\b|\b413\b/i,
      type: 'HTTP 4xx Client Error',
      category: 'HTTP Client Error',
      sev: 'warning',
      hypothesis: 'Hypothesis: The request may contain invalid parameters, missing auth credentials, or exceed payload limits.',
      recommended_team: 'API',
      diagnostic_questions: [
        'Does the request payload match the expected API schema and size limits?',
        'Is the authentication token present and unexpired?',
      ],
      confidence: 'Medium',
    },
    {
      re: /CORS|Access-Control-Allow-Origin/i,
      type: 'CORS Policy Error',
      category: 'CORS / Security',
      sev: 'warning',
      hypothesis: 'Hypothesis: The API gateway or server may not be returning required Access-Control-Allow-Origin headers for this origin.',
      recommended_team: 'DevOps',
      diagnostic_questions: [
        'Is the frontend origin listed in the backend CORS allowlist?',
        'Are preflight OPTIONS requests succeeding with HTTP 200/204?',
      ],
      confidence: 'High',
    },
    {
      re: /timeout|ETIMEDOUT|ECONNABORTED/i,
      type: 'Timeout Error',
      category: 'Network / Latency',
      sev: 'warning',
      hypothesis: 'Hypothesis: The operation may have exceeded its configured timeout due to slow queries, network latency, or deadlock.',
      recommended_team: 'DevOps',
      diagnostic_questions: [
        'How long did the request take before timing out?',
        'Is a specific database query or external API call blocking the response?',
      ],
      confidence: 'Medium',
    },
    {
      re: /ECONNREFUSED|connection refused|pool exhausted|too many connections|Sequelize|Postgres|PG::|SQLSTATE/i,
      type: 'Database Connection Error',
      category: 'Database Error',
      sev: 'critical',
      hypothesis: 'Hypothesis: The database connection pool may be exhausted, misconfigured, or unreachable from the application host.',
      recommended_team: 'Database',
      diagnostic_questions: [
        'Are database connections being leaked or not released after transactions?',
        'Is the database service healthy and accepting connections on the configured port?',
      ],
      confidence: 'Medium',
    },
    {
      re: /Cannot find module|ModuleNotFoundError|ERR_MODULE_NOT_FOUND|ImportError|NoClassDefFoundError/i,
      type: 'Dependency Error',
      category: 'Dependency / Build',
      sev: 'critical',
      hypothesis: 'Hypothesis: A required package or module may be missing, unbuilt, or mismatched in the runtime environment.',
      recommended_team: 'DevOps',
      diagnostic_questions: [
        'Was the dependency installed and built in the target deployment environment?',
        'Do lockfile versions match what the build expects?',
      ],
      confidence: 'High',
    },
    {
      re: /ENV|environment variable|not configured|EACCES|permission denied|403/i,
      type: 'Configuration / Permission Error',
      category: 'Configuration Error',
      sev: 'warning',
      hypothesis: 'Hypothesis: Missing environment configuration, invalid credentials, or insufficient role permissions may be blocking execution.',
      recommended_team: 'DevOps',
      diagnostic_questions: [
        'Are all required environment variables set in this environment?',
        'Does the acting user or service account have the required permissions?',
      ],
      confidence: 'Medium',
    },
    {
      re: /\b404\b/i,
      type: '404 Not Found',
      category: 'HTTP Client Error',
      sev: 'info',
      hypothesis: 'Hypothesis: The requested route, static asset, or entity ID may not exist in this environment.',
      recommended_team: 'Backend',
      diagnostic_questions: [
        'Does the endpoint path match the current API version and route table?',
        'Was the target record deleted or never seeded?',
      ],
      confidence: 'Medium',
    },
  ];

  const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);

  for (const pat of patterns) {
    if (pat.re.test(txt) && !seen.has(pat.type)) {
      seen.add(pat.type);
      const matchedLine = lines.find(l => pat.re.test(l)) || lines[0] || txt.trim().slice(0, 140);
      results.push({
        type: pat.type,
        category: pat.category,
        sev: pat.sev,
        context: matchedLine.slice(0, 160),
        hypothesis: pat.hypothesis,
        recommended_team: pat.recommended_team,
        diagnostic_questions: pat.diagnostic_questions,
        confidence: pat.confidence,
      });
    }
  }
  return results;
}

export function classifyDefect(fields: DefectFields): DefectClassification {
  const combined = `${fields.title} ${fields.desc} ${fields.comp} ${fields.exc} ${fields.env}`.toLowerCase();

  const rules: Array<{ category: DefectCategory; re: RegExp; reason: string }> = [
    { category: 'Authentication', re: /\b(login|auth|2fa|oauth|jwt|token|session|password|sso|forbidden|401|403)\b/i, reason: 'References authentication, session, or access control.' },
    { category: 'Database', re: /\b(sql|postgres|mysql|mongo|database|db|query|migration|schema|pool|deadlock)\b/i, reason: 'References database queries, connections, or persistence.' },
    { category: 'Performance', re: /\b(slow|latency|timeout|memory|oom|cpu|lag|freeze|hang|concurrent|load)\b/i, reason: 'Describes latency, resource exhaustion, or timeout behavior.' },
    { category: 'API', re: /\b(api|endpoint|rest|graphql|http\s*[45]\d\d|payload|json|webhook|cors|status\s*code)\b/i, reason: 'Involves HTTP/API request or response handling.' },
    { category: 'Accessibility', re: /\b(a11y|accessibility|screen\s*reader|aria|keyboard|tab\s*order|contrast|wcag)\b/i, reason: 'Involves keyboard navigation, screen readers, or WCAG accessibility.' },
    { category: 'Compatibility', re: /\b(safari|firefox|chrome|edge|ios|android|mobile|tablet|browser|viewport|cross-browser)\b/i, reason: 'Specifies browser, OS, or device-specific behavior.' },
    { category: 'Regression', re: /\b(regression|used\s*to\s*work|after\s*(update|deploy|release|upgrade)|broke\s*in)\b/i, reason: 'Indicates previously working functionality broke after a change.' },
    { category: 'Configuration', re: /\b(env|config|setting|flag|secret|deployment|docker|ci\/cd|port)\b/i, reason: 'Relates to environment or configuration settings.' },
    { category: 'Integration', re: /\b(integration|webhook|third-party|sync|bridge|service-to-service|upstream)\b/i, reason: 'Involves communication across services or external integrations.' },
    { category: 'UI/UX', re: /\b(ui|ux|css|layout|button|modal|dropdown|scroll|overlap|align|render|display|click)\b/i, reason: 'Describes visual layout, styling, or UI interaction.' },
  ];

  for (const r of rules) {
    if (r.re.test(combined)) {
      return { category: r.category, confidence: 'High', reason: r.reason };
    }
  }

  return {
    category: 'Functional',
    confidence: 'Medium',
    reason: 'Defaulted to Functional based on general behavioral defect description.',
  };
}

function guessAssignee(fields: DefectFields, exceptions: ExceptionMatch[], category: DefectCategory): string {
  if (exceptions.length > 0 && exceptions[0].recommended_team) {
    return exceptions[0].recommended_team;
  }
  const comp = fields.comp.toLowerCase();
  if (comp.includes('ui') || comp.includes('frontend') || comp.includes('css') || category === 'UI/UX' || category === 'Accessibility' || category === 'Compatibility') return 'Frontend';
  if (comp.includes('db') || comp.includes('database') || category === 'Database') return 'Database';
  if (comp.includes('deploy') || comp.includes('infra') || comp.includes('ci') || category === 'Configuration') return 'DevOps';
  if (category === 'API' || category === 'Authentication' || category === 'Integration') return 'Backend';
  return 'Backend';
}

function suggestSeverityAndPriority(fields: DefectFields, exceptions: ExceptionMatch[]): { severity: string; priority: string } {
  if (fields.sev && fields.pri) return { severity: fields.sev, priority: fields.pri };
  const hasCriticalExc = exceptions.some(e => e.sev === 'critical');
  const txt = `${fields.title} ${fields.desc}`.toLowerCase();
  const isSecurityOrCrash = /\b(crash|data\s*loss|security|xss|pii|unresponsive|blocker|500|oom)\b/.test(txt);

  const severity = fields.sev || (hasCriticalExc || isSecurityOrCrash ? 'High' : 'Medium');
  const priority = fields.pri || (severity === 'Critical' ? 'P1' : severity === 'High' ? 'P2' : 'P3');
  return { severity, priority };
}

export function generateTestCases(fields: DefectFields, category: DefectCategory): GeneratedTestCase[] {
  const title = fields.title.trim() || 'reported feature';
  const exp = fields.exp.trim() || 'the expected application behavior occurs';
  const act = fields.act.trim() || 'no unhandled error occurs';
  const comp = fields.comp.trim() || category;

  return [
    {
      type: 'Positive',
      title: `Verify expected behavior for ${comp}`,
      gherkin: `Feature: ${comp}\n\nScenario: ${title}\n  Given the documented starting conditions\n  When the user performs the reported action\n  Then ${exp}`,
    },
    {
      type: 'Negative',
      title: 'Verify graceful handling of invalid or missing state',
      gherkin: `Feature: ${comp} error handling\n\nScenario: Prevent ${act}\n  Given invalid or incomplete input preconditions\n  When the user triggers the workflow\n  Then the system displays a clear validation message without failing silently`,
    },
    {
      type: 'Boundary',
      title: 'Verify boundary and environment edge conditions',
      gherkin: `Feature: ${comp} boundary conditions\n\nScenario: Boundary test for ${title}\n  Given boundary input values or constrained environment settings\n  When the action is executed repeatedly\n  Then the system remains stable and responds within acceptable limits`,
    },
    {
      type: 'Regression',
      title: 'Verify adjacent workflows remain unaffected',
      gherkin: `Feature: ${comp} regression guard\n\nScenario: Confirm fix does not regress related flows\n  Given a valid user session after the defect fix is applied\n  When related ${comp} actions are performed\n  Then all existing functionality continues to pass`,
    },
  ];
}

export function buildRewrite(
  fields: DefectFields,
  overallScore: number,
  grade: string,
  missingAlerts: AnalysisResult['missing_alerts'],
  category: DefectCategory
): string {
  const missingList = missingAlerts.length
    ? missingAlerts.map(a => `- ${a.field}: ${a.message}`).join('\n')
    : 'None — all core fields provided.';

  const stepsBlock = fields.steps.trim()
    ? fields.steps.trim()
    : '1. [Requires clarification — reproduction steps not provided]\n2. [Requires clarification]\n3. [Requires clarification]';

  return [
    'DEFECT REPORT',
    '',
    `Title: ${fields.title.trim() || '[Requires clarification]'}`,
    `Description: ${fields.desc.trim() || '[Requires clarification]'}`,
    '',
    'Steps to Reproduce:',
    stepsBlock,
    '',
    `Expected Result: ${fields.exp.trim() || '[Requires clarification]'}`,
    '',
    `Actual Result: ${fields.act.trim() || '[Requires clarification]'}`,
    '',
    `Environment: ${fields.env.trim() || '[Requires clarification]'}`,
    '',
    `Severity: ${fields.sev || '[Requires clarification]'}`,
    `Priority: ${fields.pri || '[Requires clarification]'}`,
    `Component: ${fields.comp.trim() || category}`,
    `Additional Evidence: ${fields.att.trim() || fields.exc.trim() || '[None provided]'}`,
    '',
    'Missing Information:',
    missingList,
    '',
    `Quality Assessment: ${overallScore}/100 (${grade}) — Category: ${category}`,
  ].join('\n');
}

export function ruleBasedAnalysis(fields: DefectFields): AnalysisResult {
  const { title, desc, steps, exp, act, env, sev } = fields;

  const tScore   = scoreTitle(title);
  const dScore   = scoreDesc(desc);
  const sScore   = scoreSteps(steps);
  const eaScore  = scoreExpAct(exp, act);
  const envScore = scoreEnv(env);
  const sevScore = sev ? 5 : 0;
  const attScore = scoreAtt(fields.att);

  const section_scores: SectionScores = {
    title: tScore,
    description: dScore,
    steps: sScore,
    expected_actual: eaScore,
    environment: envScore,
    severity: sevScore,
    attachments: attScore,
  };

  const overall = tScore + dScore + sScore + eaScore + envScore + sevScore + attScore;
  const section_explanations = explainSections(fields, section_scores);

  const alerts: AnalysisResult['missing_alerts'] = [];
  const suggestions: string[] = [];

  const junkFields: Array<{ key: string; label: string; val: string; max: number }> = [
    { key: 'title', label: 'Bug Title', val: title, max: 20 },
    { key: 'desc',  label: 'Description', val: desc, max: 20 },
    { key: 'steps', label: 'Steps to Reproduce', val: steps, max: 20 },
    { key: 'exp',   label: 'Expected Result', val: exp, max: 15 },
    { key: 'act',   label: 'Actual Result',   val: act, max: 15 },
    { key: 'env',   label: 'Environment',     val: env, max: 15 },
  ];
  for (const f of junkFields) {
    if (contentQuality(f.val) === 'junk') {
      alerts.push({
        field: f.label,
        severity: 'critical',
        message: `"${f.label}" contains repeated or nonsense characters — scored 1/${f.max}.`,
      });
    }
  }

  const titleT = title.trim();
  const descT  = desc.trim();
  const stepsT = steps.trim();
  const expT   = exp.trim();
  const actT   = act.trim();
  const envT   = env.trim();

  if (!titleT) {
    alerts.push({ field: 'Bug Title', severity: 'critical', message: 'A descriptive title is required. Include the component, action, and observed behavior.' });
  } else if (contentQuality(titleT) === 'ok' && titleT.length < 15) {
    alerts.push({ field: 'Bug Title', severity: 'warning', message: 'Title is too short. Add component name, environment, or specific failure detail.' });
  }

  if (!descT) {
    alerts.push({ field: 'Description', severity: 'critical', message: 'Description is missing. Explain what is broken and its user impact.' });
  } else if (contentQuality(descT) === 'ok' && descT.length < 50) {
    alerts.push({ field: 'Description', severity: 'warning', message: 'Description is brief. Add frequency, impact scope, and failure pattern.' });
  }

  if (!stepsT) {
    alerts.push({ field: 'Steps to Reproduce', severity: 'critical', message: 'Reproduction steps are required. Number each step clearly.' });
  } else if (contentQuality(stepsT) === 'ok' && !stepsT.includes('\n')) {
    alerts.push({ field: 'Steps to Reproduce', severity: 'warning', message: 'Steps appear unnumbered. Format as 1. Step one\\n2. Step two for clarity.' });
  }

  const expOk = contentQuality(expT) === 'ok';
  const actOk = contentQuality(actT) === 'ok';
  if (!expT && !actT) {
    alerts.push({ field: 'Expected / Actual Result', severity: 'critical', message: 'Both expected and actual results are needed to validate the fix.' });
  } else if (!expT) {
    alerts.push({ field: 'Expected Result', severity: 'warning', message: 'Missing expected behavior — add what should happen after the steps.' });
  } else if (!actT) {
    alerts.push({ field: 'Actual Result', severity: 'warning', message: 'Missing actual behavior — describe what actually happened.' });
  }

  if (!envT)              alerts.push({ field: 'Environment', severity: 'warning', message: 'No environment info. Add OS, browser, app version, and server/env name.' });
  if (!sev)               alerts.push({ field: 'Severity',    severity: 'info',    message: 'Severity not set. Helps triage and prioritization.' });
  if (!fields.att.trim()) alerts.push({ field: 'Attachments', severity: 'info',    message: 'No attachments. Screenshots, logs, or screen recordings speed up diagnosis.' });

  if (contentQuality(titleT) === 'ok' && titleT.length > 0 && titleT.length <= 60)
    suggestions.push('Refine the title to follow "[Component] [Action] [Failure] on [Platform/Version]".');
  if (contentQuality(descT) === 'ok' && descT.length < 200)
    suggestions.push('Expand the description with frequency, affected user segment, and whether this is a recent regression.');
  if (contentQuality(stepsT) === 'ok' && (stepsT.match(/\n/g) || []).length < 4)
    suggestions.push('Add prerequisite state before Step 1 and expand into 4+ numbered steps for deterministic reproduction.');
  if (!envT)
    suggestions.push('Specify OS, browser/runtime version, app build, and environment (staging/production).');
  if (!fields.att.trim())
    suggestions.push('Attach console logs, HAR network traces, or screenshots to reduce triage back-and-forth.');

  const exceptions = parseException(fields.exc);
  const classification = classifyDefect(fields);
  const { severity: suggested_severity, priority: suggested_priority } = suggestSeverityAndPriority(fields, exceptions);
  const assignee = guessAssignee(fields, exceptions, classification.category);
  const test_cases = generateTestCases(fields, classification.category);
  const grade = gradeMeta(overall).label;
  const rewrite = buildRewrite(fields, overall, grade, alerts, classification.category);

  const riskLevel: AnalysisResult['risk_level'] =
    (sev === 'Critical' || sev === 'High' || overall < 55 || exceptions.some(e => e.sev === 'critical')) ? 'High' :
    (sev === 'Medium' || overall < 75) ? 'Medium' : 'Low';

  const effort: AnalysisResult['estimated_fix_effort'] =
    fields.exc.includes('OutOfMemory') || fields.exc.includes('StackOverflow') ? 'Weeks' :
    sev === 'Critical' ? 'Hours' : 'Days';

  const excAnalysis = exceptions.length > 0
    ? `${exceptions[0].type} (${exceptions[0].category}): ${exceptions[0].hypothesis}`
    : fields.exc.trim()
      ? 'Hypothesis: Custom error trace provided; verify failing module logs and input state.'
      : 'No exception provided.';

  const testHint = test_cases[0]?.gherkin ??
    'Feature: Application functionality\n\nScenario: Reported defect scenario\n  Given the documented starting conditions\n  When the user performs the reported action\n  Then the expected behavior should occur';

  return {
    overall_score: overall,
    section_scores,
    section_explanations,
    missing_alerts: alerts,
    suggestions: suggestions.slice(0, 4),
    exception_analysis: excAnalysis,
    exceptions,
    risk_level: riskLevel,
    estimated_fix_effort: effort,
    recommended_assignee: assignee,
    suggested_severity,
    suggested_priority,
    defect_category: classification.category,
    classification,
    test_case_hint: testHint,
    test_cases,
    rewritten_report: rewrite,
    analysis_mode: 'rule-based',
  };
}

export async function aiAnalysis(fields: DefectFields): Promise<AnalysisResult> {
  const baseline = ruleBasedAnalysis(fields);
  try {
    const res = await fetch('/api/analyze/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as { error?: string };
      return {
        ...baseline,
        analysis_mode: 'ai-fallback',
        fallback_reason: errData.error || `AI endpoint returned ${res.status}`,
      };
    }
    const aiData = await res.json() as Partial<AnalysisResult>;
    return {
      ...baseline,
      suggestions: Array.isArray(aiData.suggestions) && aiData.suggestions.length > 0 ? aiData.suggestions : baseline.suggestions,
      exception_analysis: aiData.exception_analysis || baseline.exception_analysis,
      rewritten_report: aiData.rewritten_report || baseline.rewritten_report,
      test_case_hint: aiData.test_case_hint || baseline.test_case_hint,
      analysis_mode: 'ai',
    };
  } catch (err) {
    return {
      ...baseline,
      analysis_mode: 'ai-fallback',
      fallback_reason: err instanceof Error ? err.message : 'AI service unreachable',
    };
  }
}

/* ── Local Duplicate Defect Detection ────────────────────────────────── */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach(w => { if (b.has(w)) inter++; });
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function findDuplicates(fields: DefectFields, history: HistoryItem[], threshold = 0.3): DuplicateMatch[] {
  if (!fields.title.trim() && !fields.desc.trim()) return [];
  const curTitle = tokenize(fields.title);
  const curDesc = tokenize(fields.desc);
  const curExpAct = tokenize(`${fields.exp} ${fields.act}`);
  const curComp = fields.comp.trim().toLowerCase();
  const curCat = classifyDefect(fields).category;
  const curExcTypes = new Set(parseException(fields.exc).map(e => e.type));

  const matches: DuplicateMatch[] = [];

  for (const item of history) {
    const matchedOn: string[] = [];
    const hTitle = tokenize(item.fields?.title || item.title);
    const hDesc = tokenize(item.fields?.desc || '');
    const hExpAct = tokenize(`${item.fields?.exp || ''} ${item.fields?.act || ''}`);

    const titleSim = jaccard(curTitle, hTitle);
    const descSim = jaccard(curDesc, hDesc);
    const expActSim = jaccard(curExpAct, hExpAct);

    let score = titleSim * 0.45 + descSim * 0.30 + expActSim * 0.15;

    if (titleSim >= 0.25) matchedOn.push('Title');
    if (descSim >= 0.2) matchedOn.push('Description');
    if (expActSim >= 0.2) matchedOn.push('Expected/Actual');

    const hComp = (item.fields?.comp || '').trim().toLowerCase();
    if (curComp && hComp && curComp === hComp) {
      score += 0.05;
      matchedOn.push('Component');
    }

    const hCat = item.parsed?.defect_category;
    if (hCat && hCat === curCat) {
      score += 0.05;
      matchedOn.push('Category');
    }

    const hExcTypes = (item.parsed?.exceptions || parseException(item.fields?.exc || '')).map(e => e.type);
    if (curExcTypes.size > 0 && hExcTypes.some(t => curExcTypes.has(t))) {
      score += 0.1;
      matchedOn.push('Error Type');
    }

    const pct = Math.min(100, Math.round(score * 100));
    if (pct >= Math.round(threshold * 100) && matchedOn.length > 0) {
      matches.push({ item, similarity: pct, matchedOn });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}
