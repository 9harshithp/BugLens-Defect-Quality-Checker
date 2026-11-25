import { Router, type IRouter } from 'express';
import { z } from 'zod/v4';
import { eq, desc, and } from 'drizzle-orm';
import {
  db,
  defectReportsTable,
  analysesTable,
  sectionScoresTable,
  recommendationsTable,
  testCasesTable,
} from '@workspace/db';
import { requireAuth, type AuthenticatedRequest } from '../lib/auth';

const router: IRouter = Router();

const CreateReportSchema = z.object({
  id: z.number(),
  timestamp: z.number(),
  title: z.string(),
  score: z.number(),
  grade: z.string(),
  isDraft: z.boolean().optional(),
  fields: z.record(z.string(), z.unknown()),
  parsed: z.record(z.string(), z.unknown()),
});

router.get('/reports', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  try {
    const reports = await db
      .select()
      .from(defectReportsTable)
      .where(eq(defectReportsTable.userId, userId))
      .orderBy(desc(defectReportsTable.createdAt))
      .limit(50);

    const out = [];
    for (const r of reports) {
      const [analysis] = await db
        .select()
        .from(analysesTable)
        .where(eq(analysesTable.reportId, r.id))
        .orderBy(desc(analysesTable.id))
        .limit(1);

      if (!analysis) continue;
      out.push({
        id: Number(r.clientId) || r.id,
        dbId: r.id,
        timestamp: r.createdAt.getTime(),
        title: r.title,
        score: analysis.overallScore,
        grade: analysis.grade,
        isDraft: r.isDraft,
        fields: r.fields,
        parsed: analysis.parsed,
      });
    }

    res.json({ reports: out });
  } catch {
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

router.post('/reports', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const parsedBody = CreateReportSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: 'Invalid report payload' });
    return;
  }

  const data = parsedBody.data;
  const parsedObj = data.parsed as Record<string, unknown>;
  try {
    const [report] = await db
      .insert(defectReportsTable)
      .values({
        userId,
        clientId: String(data.id),
        title: data.title || 'Untitled Defect',
        isDraft: Boolean(data.isDraft),
        fields: data.fields,
      })
      .returning();

    const [analysis] = await db
      .insert(analysesTable)
      .values({
        reportId: report.id,
        overallScore: data.score,
        grade: data.grade,
        defectCategory: String(parsedObj.defect_category || 'Functional'),
        riskLevel: String(parsedObj.risk_level || 'Medium'),
        parsed: data.parsed,
      })
      .returning();

    const sectionScores = (parsedObj.section_scores || {}) as Record<string, number>;
    const explanations = (parsedObj.section_explanations || {}) as Record<string, string>;
    const maxMap: Record<string, number> = {
      title: 20, description: 20, steps: 20, expected_actual: 15, environment: 15, severity: 5, attachments: 5,
    };

    const scoreRows = Object.entries(sectionScores).map(([key, score]) => ({
      analysisId: analysis.id,
      sectionKey: key,
      score: Number(score) || 0,
      maxScore: maxMap[key] ?? 20,
      explanation: explanations[key] || '',
    }));
    if (scoreRows.length > 0) {
      await db.insert(sectionScoresTable).values(scoreRows);
    }

    const suggestions = Array.isArray(parsedObj.suggestions) ? (parsedObj.suggestions as string[]) : [];
    if (suggestions.length > 0) {
      await db.insert(recommendationsTable).values(
        suggestions.map(text => ({ analysisId: analysis.id, text: String(text) }))
      );
    }

    const testCases = Array.isArray(parsedObj.test_cases)
      ? (parsedObj.test_cases as Array<{ type: string; title: string; gherkin: string }>)
      : [];
    if (testCases.length > 0) {
      await db.insert(testCasesTable).values(
        testCases.map(tc => ({
          analysisId: analysis.id,
          type: String(tc.type),
          title: String(tc.title),
          gherkin: String(tc.gherkin),
        }))
      );
    }

    res.status(201).json({ ok: true, dbId: report.id });
  } catch {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

router.patch('/reports/:clientId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const clientId = String(req.params.clientId);
  const body = z.object({ parsed: z.record(z.string(), z.unknown()), isDraft: z.boolean().optional() }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'Invalid update payload' });
    return;
  }

  try {
    const [report] = await db
      .select()
      .from(defectReportsTable)
      .where(and(eq(defectReportsTable.clientId, clientId), eq(defectReportsTable.userId, userId)))
      .limit(1);

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (typeof body.data.isDraft === 'boolean') {
      await db.update(defectReportsTable).set({ isDraft: body.data.isDraft, updatedAt: new Date() }).where(eq(defectReportsTable.id, report.id));
    }

    await db
      .update(analysesTable)
      .set({
        parsed: body.data.parsed,
        defectCategory: String((body.data.parsed as Record<string, unknown>).defect_category || 'Functional'),
      })
      .where(eq(analysesTable.reportId, report.id));

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

router.delete('/reports/:clientId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const clientId = String(req.params.clientId);
  try {
    await db
      .delete(defectReportsTable)
      .where(and(eq(defectReportsTable.clientId, clientId), eq(defectReportsTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

router.delete('/reports', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  try {
    await db.delete(defectReportsTable).where(eq(defectReportsTable.userId, userId));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to clear reports' });
  }
});

export default router;
