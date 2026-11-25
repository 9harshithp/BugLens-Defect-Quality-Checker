import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessionsTable = pgTable('sessions', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const defectReportsTable = pgTable('defect_reports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull(),
  title: text('title').notNull(),
  isDraft: boolean('is_draft').default(false).notNull(),
  fields: jsonb('fields').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const analysesTable = pgTable('analyses', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id')
    .notNull()
    .references(() => defectReportsTable.id, { onDelete: 'cascade' }),
  overallScore: integer('overall_score').notNull(),
  grade: text('grade').notNull(),
  defectCategory: text('defect_category').notNull(),
  riskLevel: text('risk_level').notNull(),
  parsed: jsonb('parsed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sectionScoresTable = pgTable('section_scores', {
  id: serial('id').primaryKey(),
  analysisId: integer('analysis_id')
    .notNull()
    .references(() => analysesTable.id, { onDelete: 'cascade' }),
  sectionKey: text('section_key').notNull(),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  explanation: text('explanation').notNull(),
});

export const recommendationsTable = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  analysisId: integer('analysis_id')
    .notNull()
    .references(() => analysesTable.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
});

export const testCasesTable = pgTable('test_cases', {
  id: serial('id').primaryKey(),
  analysisId: integer('analysis_id')
    .notNull()
    .references(() => analysesTable.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  gherkin: text('gherkin').notNull(),
});
