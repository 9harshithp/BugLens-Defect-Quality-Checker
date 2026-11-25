import { describe, it, expect } from 'vitest';
import {
  contentQuality,
  gradeMeta,
  parseException,
  classifyDefect,
  ruleBasedAnalysis,
  findDuplicates,
  generateTestCases,
} from '../lib/analysis';
import type { DefectFields, HistoryItem } from '../lib/types';

const emptyFields: DefectFields = {
  title: '', desc: '', steps: '', exp: '', act: '',
  env: '', sev: '', pri: '', comp: '', rep: '', exc: '', att: '',
};

const strongFields: DefectFields = {
  title: 'Checkout payment submission returns HTTP 500 on Safari 17 during card processing',
  desc: 'When authenticated users attempt to complete a card payment on Safari 17, the checkout submission consistently fails with a 500 Internal Server Error. This started after the v2.4.1 release and affects all Safari users attempting 3DS verification.',
  steps: '1. Log in with a standard customer account\n2. Add any in-stock item to the cart\n3. Proceed to Checkout and enter valid card details\n4. Click Pay Now\n5. Observe the network response and UI state',
  exp: 'Payment succeeds and user is redirected to the order confirmation page.',
  act: 'Checkout spinner freezes and POST /api/payments returns HTTP 500.',
  env: 'macOS 14.3, Safari 17.2, App v2.4.1, Production',
  sev: 'Critical',
  pri: 'P1',
  comp: 'Checkout API',
  rep: 'QA Team',
  exc: 'HTTP 500 Internal Server Error\nTypeError: Cannot read properties of undefined (reading "amount")',
  att: 'https://logs.internal/har/checkout-500.har',
};

describe('contentQuality', () => {
  it('detects empty and whitespace-only strings', () => {
    expect(contentQuality('')).toBe('empty');
    expect(contentQuality('   \n\t ')).toBe('empty');
  });

  it('detects repeated-character and gibberish junk', () => {
    expect(contentQuality('AAAAAAA')).toBe('junk');
    expect(contentQuality('ababababab')).toBe('junk');
    expect(contentQuality('bcdfghjklmnpqrstvwxyz')).toBe('junk');
  });

  it('accepts meaningful English text', () => {
    expect(contentQuality('Login button fails to submit form on Safari 17')).toBe('ok');
  });
});

describe('gradeMeta', () => {
  it('maps scores to the 4 PRD grades including Needs Improvement', () => {
    expect(gradeMeta(95).label).toBe('Excellent');
    expect(gradeMeta(80).label).toBe('Good');
    expect(gradeMeta(65).label).toBe('Needs Improvement');
    expect(gradeMeta(40).label).toBe('Incomplete');
  });
});

describe('classifyDefect', () => {
  it('classifies authentication and database defects accurately', () => {
    expect(classifyDefect({ ...emptyFields, title: '2FA login fails with 401 token error' }).category).toBe('Authentication');
    expect(classifyDefect({ ...emptyFields, title: 'Postgres pool exhausted during query' }).category).toBe('Database');
    expect(classifyDefect({ ...emptyFields, title: 'Layout button overlap on mobile viewport', comp: 'UI' }).category).toBe('Compatibility');
  });
});

describe('parseException', () => {
  it('extracts error category, hypothesis, team, and diagnostic questions', () => {
    const matches = parseException('TypeError: Cannot read properties of undefined\nCORS policy blocked');
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches[0].type).toBe('TypeError');
    expect(matches[0].hypothesis).toContain('Hypothesis:');
    expect(matches[0].diagnostic_questions.length).toBeGreaterThan(0);
    expect(matches[1].type).toBe('CORS Policy Error');
  });
});

describe('ruleBasedAnalysis', () => {
  it('scores strong reports highly and provides section explanations', () => {
    const res = ruleBasedAnalysis(strongFields);
    expect(res.overall_score).toBeGreaterThanOrEqual(85);
    expect(res.section_explanations?.title).toContain('/20:');
    expect(res.defect_category).toBe('API');
    expect(res.rewritten_report).toContain('DEFECT REPORT');
    expect(res.test_cases?.length).toBe(4);
  });

  it('marks missing fields as [Requires clarification] without fabricating', () => {
    const res = ruleBasedAnalysis(emptyFields);
    expect(res.overall_score).toBe(0);
    expect(res.rewritten_report).toContain('[Requires clarification]');
  });
});

describe('generateTestCases', () => {
  it('generates Positive, Negative, Boundary, and Regression Gherkin scenarios', () => {
    const cases = generateTestCases(strongFields, 'API');
    expect(cases.map(c => c.type)).toEqual(['Positive', 'Negative', 'Boundary', 'Regression']);
    expect(cases[0].gherkin).toContain('Given');
    expect(cases[0].gherkin).toContain('When');
    expect(cases[0].gherkin).toContain('Then');
  });
});

describe('findDuplicates', () => {
  it('identifies similar defect reports in history', () => {
    const existing: HistoryItem = {
      id: 1,
      timestamp: Date.now() - 10000,
      title: strongFields.title,
      score: 90,
      grade: 'Excellent',
      parsed: ruleBasedAnalysis(strongFields),
      fields: strongFields,
    };
    const dups = findDuplicates(
      { ...emptyFields, title: 'Checkout payment submission returns HTTP 500 on Safari', desc: strongFields.desc, comp: 'Checkout API' },
      [existing]
    );
    expect(dups.length).toBe(1);
    expect(dups[0].similarity).toBeGreaterThanOrEqual(30);
    expect(dups[0].matchedOn).toContain('Title');
  });
});
