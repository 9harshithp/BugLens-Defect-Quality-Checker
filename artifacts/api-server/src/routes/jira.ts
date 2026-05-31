import { Router, type IRouter } from 'express';

const router: IRouter = Router();

function jiraFetch(path: string, method = 'GET', body?: unknown) {
  const host = process.env.JIRA_HOST?.replace(/\/+$/, '');
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!host || !email || !token) throw new Error('Jira not configured');
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  return fetch(`${host}/rest/api/3${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

router.get('/jira/status', async (_req, res) => {
  try {
    const resp = await jiraFetch('/myself');
    if (!resp.ok) {
      res.status(resp.status).json({ connected: false, error: 'Jira authentication failed — check credentials' });
      return;
    }
    const d = await resp.json() as { displayName: string; emailAddress: string };
    res.json({ connected: true, displayName: d.displayName, email: d.emailAddress });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    res.status(msg === 'Jira not configured' ? 503 : 500).json({ connected: false, error: msg });
  }
});

router.get('/jira/projects', async (_req, res) => {
  try {
    const resp = await jiraFetch('/project/search?maxResults=50&orderBy=name');
    if (!resp.ok) { res.status(resp.status).json(await resp.json()); return; }
    res.json(await resp.json());
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' });
  }
});

router.get('/jira/issues', async (req, res) => {
  const { projectKey, maxResults = '25', startAt = '0' } = req.query as Record<string, string>;
  if (!projectKey) { res.status(400).json({ error: 'projectKey required' }); return; }
  try {
    const jql = encodeURIComponent(`project = "${projectKey}" ORDER BY created DESC`);
    const resp = await jiraFetch(
      `/search?jql=${jql}&maxResults=${maxResults}&startAt=${startAt}&fields=summary,description,issuetype,priority,status,reporter,created`,
    );
    if (!resp.ok) { res.status(resp.status).json(await resp.json()); return; }
    res.json(await resp.json());
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' });
  }
});

router.post('/jira/create-issue', async (req, res) => {
  const { projectKey, summary, description, priority } = req.body as {
    projectKey: string; summary: string; description: string; priority?: string;
  };
  if (!projectKey || !summary) { res.status(400).json({ error: 'projectKey and summary required' }); return; }
  const priorityMap: Record<string, string> = {
    high: 'High', medium: 'Medium', low: 'Low', critical: 'Highest',
  };
  const host = process.env.JIRA_HOST?.replace(/\/+$/, '') ?? '';
  const body = {
    fields: {
      project: { key: projectKey },
      summary,
      description: {
        type: 'doc', version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: description || summary }] }],
      },
      issuetype: { name: 'Bug' },
      ...(priority ? { priority: { name: priorityMap[priority.toLowerCase()] ?? 'Medium' } } : {}),
    },
  };
  try {
    const resp = await jiraFetch('/issue', 'POST', body);
    const d = await resp.json() as { id?: string; key?: string; errors?: unknown };
    if (!resp.ok) { res.status(resp.status).json({ error: d.errors ?? 'Failed to create issue' }); return; }
    res.json({ ...d, browseUrl: `${host}/browse/${d.key}` });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' });
  }
});

export default router;
