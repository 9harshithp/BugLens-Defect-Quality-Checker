export interface User {
  id?: number;
  username: string;
  role: string;
  name: string;
}

export const USER_ROLES = [
  'QA Engineer',
  'QA Lead',
  'Software Developer',
  'Business Analyst',
  'Product Manager',
  'DevOps Engineer',
  'Administrator',
] as const;

export const DEFECT_CATEGORIES = [
  'Functional',
  'UI/UX',
  'Performance',
  'API',
  'Database',
  'Authentication',
  'Compatibility',
  'Integration',
  'Configuration',
  'Accessibility',
  'Regression',
] as const;

export type DefectCategory = (typeof DEFECT_CATEGORIES)[number];

export interface SectionScores {
  title: number;
  description: number;
  steps: number;
  expected_actual: number;
  environment: number;
  severity: number;
  attachments: number;
}

export const SECTION_META = {
  title:           { l: 'Title',    m: 20 },
  description:     { l: 'Desc',     m: 20 },
  steps:           { l: 'Steps',    m: 20 },
  expected_actual: { l: 'Exp/Act',  m: 15 },
  environment:     { l: 'Env',      m: 15 },
  severity:        { l: 'Severity', m: 5  },
  attachments:     { l: 'Attach',   m: 5  },
} as const;

export type SectionKey = keyof typeof SECTION_META;

export type SectionExplanations = Record<SectionKey, string>;

export interface MissingAlert {
  field: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface ExceptionMatch {
  type: string;
  category: string;
  sev: 'critical' | 'warning' | 'info';
  context: string;
  hypothesis: string;
  recommended_team: string;
  diagnostic_questions: string[];
  confidence: 'High' | 'Medium' | 'Low';
}

export interface GeneratedTestCase {
  type: 'Positive' | 'Negative' | 'Boundary' | 'Regression';
  title: string;
  gherkin: string;
}

export interface DefectClassification {
  category: DefectCategory;
  confidence: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface AnalysisResult {
  overall_score: number;
  section_scores: SectionScores;
  section_explanations?: SectionExplanations;
  missing_alerts: MissingAlert[];
  suggestions: string[];
  exception_analysis: string;
  exceptions?: ExceptionMatch[];
  risk_level: 'High' | 'Medium' | 'Low';
  estimated_fix_effort: 'Hours' | 'Days' | 'Weeks';
  recommended_assignee: string;
  suggested_severity?: string;
  suggested_priority?: string;
  defect_category?: DefectCategory;
  classification?: DefectClassification;
  test_case_hint: string;
  test_cases?: GeneratedTestCase[];
  rewritten_report: string;
  analysis_mode?: 'rule-based' | 'ai' | 'ai-fallback';
  fallback_reason?: string;
}

export interface DefectFields {
  title: string;
  desc: string;
  steps: string;
  exp: string;
  act: string;
  env: string;
  sev: string;
  pri: string;
  comp: string;
  rep: string;
  exc: string;
  att: string;
}

export interface HistoryItem {
  id: number;
  timestamp: number;
  title: string;
  score: number;
  grade: string;
  isDraft?: boolean;
  parsed: AnalysisResult;
  fields: DefectFields;
}

export type AppView = 'checker' | 'compare' | 'history' | 'dashboard' | 'settings';

export interface GradeMeta {
  label: string;
  bg: string;
  color: string;
}

export interface FieldHint {
  score: number;
  max: number;
  tip: string;
  color: string;
}

export interface DuplicateMatch {
  item: HistoryItem;
  similarity: number;
  matchedOn: string[];
}
