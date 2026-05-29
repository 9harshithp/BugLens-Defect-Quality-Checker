export interface User {
  username: string;
  role: string;
  name: string;
}

export interface SectionScores {
  title: number;
  description: number;
  steps: number;
  expected_actual: number;
  environment: number;
  severity: number;
  attachments: number;
}

export interface MissingAlert {
  field: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface AnalysisResult {
  overall_score: number;
  section_scores: SectionScores;
  missing_alerts: MissingAlert[];
  suggestions: string[];
  exception_analysis: string;
  risk_level: 'High' | 'Medium' | 'Low';
  estimated_fix_effort: 'Hours' | 'Days' | 'Weeks';
  recommended_assignee: string;
  test_case_hint: string;
  rewritten_report: string;
}

export interface HistoryItem {
  id: number;
  timestamp: number;
  title: string;
  score: number;
  grade: string;
  parsed: AnalysisResult;
  fields: {
    title: string; desc: string; steps: string;
    exp: string; act: string; env: string;
    sev: string; pri: string; comp: string;
    rep: string; exc: string; att: string;
  };
}

export interface ExceptionMatch {
  type: string;
  sev: 'critical' | 'warning' | 'info';
  hint: string;
}

export interface TeamComment {
  id: number;
  timestamp: number;
  username: string;
  name: string;
  role: string;
  text: string;
}

export interface TeamFeedItem {
  id: number;
  timestamp: number;
  sharedBy: User;
  reportTitle: string;
  score: number;
  grade: string;
  parsed: AnalysisResult;
  fields: HistoryItem['fields'];
  comments: TeamComment[];
}

export type AppView = 'checker' | 'compare' | 'history' | 'dashboard' | 'team';

export interface GradeMeta {
  label: string;
  bg: string;
  color: string;
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

export interface FieldHint {
  score: number;
  max: number;
  tip: string;
  color: string;
}
