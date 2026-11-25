import { Router, type IRouter } from 'express';
import { z } from 'zod/v4';
import { eq } from 'drizzle-orm';
import { db, usersTable, sessionsTable } from '@workspace/db';
import {
  hashPassword,
  verifyPassword,
  createSession,
  requireAuth,
  ensureDemoUsersSeeded,
  SESSION_COOKIE,
  type AuthenticatedRequest,
} from '../lib/auth';
import { rateLimit } from '../middlewares/rateLimit';

const router: IRouter = Router();

const RegisterSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(128),
  name: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(60),
});

const LoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

router.post('/auth/register', rateLimit(60_000, 15), async (req, res) => {
  await ensureDemoUsersSeeded().catch(() => {});
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Username (>=3), password (>=6), name, and role are required.' });
    return;
  }

  const { username, password, name, role } = parsed.data;
  try {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'That username is already taken.' });
      return;
    }

    const [created] = await db
      .insert(usersTable)
      .values({ username, passwordHash: hashPassword(password), name, role })
      .returning({ id: usersTable.id, username: usersTable.username, name: usersTable.name, role: usersTable.role });

    const { token, expiresAt } = await createSession(created.id);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });
    res.status(201).json({ user: created });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/auth/login', rateLimit(60_000, 20), async (req, res) => {
  await ensureDemoUsersSeeded().catch(() => {});
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const { username, password } = parsed.data;
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (rows.length === 0 || !verifyPassword(password, rows[0].passwordHash)) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const user = { id: rows[0].id, username: rows[0].username, name: rows[0].name, role: rows[0].role };
    const { token, expiresAt } = await createSession(user.id);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/auth/logout', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token && typeof token === 'string') {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token)).catch(() => {});
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

export default router;

