import { Router, type IRouter } from 'express';
import { z } from 'zod/v4';

const router: IRouter = Router();

const DefectFieldsSchema = z.object({
  title: z.string().default(''),
  desc: z.string().default(''),
  steps: z.string().default(''),
  exp: z.string().default(''),
  act: z.string().default(''),
  env: z.string().default(''),
  sev: z.string().default(''),
  pri: z.string().default(''),
  comp: z.string().default(''),
  rep: z.string().default(''),
  exc: z.string().default(''),
  att: z.string().default(''),
});

const AiResponseSchema = z.object({
  suggestions: z.array(z.string()).optional(),
  exception_analysis: z.string().optional(),
  test_case_hint: z.string().optional(),
  rewritten_report: z.string().optional(),
});

router.post('/analyze/ai', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'AI provider not configured on server (ANTHROPIC_API_KEY missing)' });
    return;
  }

  const parsedBody = z.object({ fields: DefectFieldsSchema }).safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: 'Invalid defect fields payload' });
    return;
  }

  const fields = parsedBody.data.fields;
  const reportText = Object.entries({
    'Bug Title': fields.title,
    'Description': fields.desc,
    'Steps to Reproduce': fields.steps,
    'Expected Result': fields.exp,
    'Actual Result': fields.act,
    'Environment': fields.env,
    'Severity': fields.sev,
    'Priority': fields.pri,
    'Component': fields.comp,
    'Reporter': fields.rep,
    'Exception/Error': fields.exc,
    'Attachments': fields.att,
  })
    .map(([k, v]) => `${k}: ${v || '[Requires clarification]'}`)
    .join('\n');

  const prompt = `You are a senior QA engineer. Improve clarity and suggest diagnostics for this defect report. NEVER invent missing reproduction steps, environment details, or application behavior — mark missing fields as [Requires clarification]. Return ONLY valid JSON with no markdown fences:\n{\n  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],\n  "exception_analysis": "<2-sentence hypothesis labeled Hypothesis: ...>",\n  "test_case_hint": "<Gherkin Feature/Scenario/Given/When/Then>",\n  "rewritten_report": "<DEFECT REPORT using verified fields only>"\n}\n\nREPORT:\n${reportText}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1800,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(14000),
    });

    if (!resp.ok) {
      res.status(502).json({ error: `AI provider returned HTTP ${resp.status}` });
      return;
    }

    const data = await resp.json() as { content?: Array<{ text?: string }>; error?: { message?: string } };
    if (data.error) {
      res.status(502).json({ error: data.error.message || 'AI provider error' });
      return;
    }

    const raw = (data.content || []).map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const si = clean.indexOf('{');
    const ei = clean.lastIndexOf('}');
    if (si === -1 || ei === -1) {
      res.status(502).json({ error: 'AI response did not contain JSON' });
      return;
    }

    const validated = AiResponseSchema.safeParse(JSON.parse(clean.slice(si, ei + 1)));
    if (!validated.success) {
      res.status(502).json({ error: 'AI response failed schema validation' });
      return;
    }

    res.json(validated.data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed';
    res.status(504).json({ error: msg });
  }
});

export default router;

