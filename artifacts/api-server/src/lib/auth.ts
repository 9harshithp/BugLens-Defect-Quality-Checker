import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { eq, gt, and } from 'drizzle-orm';
import { db, usersTable, sessionsTable } from '@workspace/db';

export const SESSION_COOKIE = 'bl_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessionsTable).values({ token, userId, expiresAt });
  return { token, expiresAt };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token || typeof token !== 'string') {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const rows = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        name: usersTable.name,
        role: usersTable.role,
      })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
      .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, new Date())))
      .limit(1);

    if (rows.length === 0) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    req.user = rows[0];
    next();
  } catch {
    res.status(500).json({ error: 'Session verification failed' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient role permissions' });
      return;
    }
    next();
  };
}

let seeded = false;
export async function ensureDemoUsersSeeded() {
  if (seeded) return;
  seeded = true;
  const demoUsers = [
    { username: 'admin',    password: 'admin123', role: 'Administrator',      name: 'Alex Admin' },
    { username: 'qa_lead',  password: 'qa1234',   role: 'QA Lead',            name: 'Quinn Arora' },
    { username: 'dev_user', password: 'dev5678',  role: 'Software Developer', name: 'Dev Patel' },
    { username: 'analyst',  password: 'pass2024', role: 'Business Analyst',   name: 'Ana Silva' },
  ];
  for (const u of demoUsers) {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, u.username)).limit(1);
    if (existing.length === 0) {
      await db.insert(usersTable).values({
        username: u.username,
        passwordHash: hashPassword(u.password),
        name: u.name,
        role: u.role,
      });
    }
  }
}

