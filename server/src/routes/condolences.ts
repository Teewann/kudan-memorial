import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { condolences, deceased, commentReports, users } from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';
import { containsBannedWord } from '../lib/bannedWords.js';

export const condolencesRouter = Router();

// Public list of approved condolences, for the homepage rail.
condolencesRouter.get('/recent', async (req, res) => {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));

  const items = await db.select({
    id: condolences.id,
    authorName: condolences.authorName,
    message: condolences.message,
    createdAt: condolences.createdAt,
    deceasedId: condolences.deceasedId,
    deceasedName: deceased.fullName,
  }).from(condolences)
    .innerJoin(deceased, eq(condolences.deceasedId, deceased.id))
    .where(eq(condolences.status, 'verified'))
    .orderBy(desc(condolences.createdAt))
    .limit(limit);

  res.json({ items });
});

// Public list of approved condolences for one person. Newest first, paginated.
condolencesRouter.get('/deceased/:id', async (req, res) => {
  const deceasedId = Number(req.params.id);
  if (!Number.isInteger(deceasedId)) return res.status(400).json({ error: 'invalid_id' });

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const conditions = and(
    eq(condolences.deceasedId, deceasedId),
    eq(condolences.status, 'verified'),
  );

  const items = await db.select({
    id: condolences.id,
    authorName: condolences.authorName,
    message: condolences.message,
    createdAt: condolences.createdAt,
    userId: condolences.userId,
  }).from(condolences)
    .where(conditions)
    .orderBy(desc(condolences.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(condolences).where(conditions);

  res.json({ items, page, limit, total: Number(count) });
});

// Post a condolence. Requires login. The author name comes from the account.
const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });

const createSchema = z.object({
  message: z.string().min(2).max(2000),
});

condolencesRouter.post(
  '/deceased/:id',
  submitLimiter,
  requireAuth,
  async (req: AuthedRequest, res) => {
    const deceasedId = Number(req.params.id);
    if (!Number.isInteger(deceasedId)) return res.status(400).json({ error: 'invalid_id' });

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

    const [person] = await db.select({ id: deceased.id }).from(deceased)
      .where(eq(deceased.id, deceasedId));
    if (!person) return res.status(404).json({ error: 'not_found' });

    const [user] = await db.select({
      id: users.id, name: users.name,
    }).from(users).where(eq(users.id, req.user!.id));
    if (!user) return res.status(401).json({ error: 'auth_required' });

    const flagged = containsBannedWord(parsed.data.message);

    const [row] = await db.insert(condolences).values({
      deceasedId,
      authorName: user.name,
      message: parsed.data.message,
      userId: user.id,
      status: flagged ? 'hidden' : 'verified',
    }).returning();

    if (flagged) {
      return res.status(422).json({
        error: 'message_blocked',
        message: 'Your message was not posted. Please keep it respectful.',
      });
    }

    res.status(201).json({ condolence: row });
  }
);

// Report a comment. Public (anyone can flag).
const reportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

const reportSchema = z.object({
  reason: z.string().max(200).optional(),
});

condolencesRouter.post('/:id/report', reportLimiter, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const [condolence] = await db.select({ id: condolences.id }).from(condolences)
    .where(eq(condolences.id, id));
  if (!condolence) return res.status(404).json({ error: 'not_found' });

  await db.insert(commentReports).values({
    condolenceId: id,
    reason: parsed.data.reason ?? null,
  });

  res.status(201).json({ ok: true });
});

// Owner edit and delete, using the logged-in account.
const ownEditSchema = z.object({
  message: z.string().min(2).max(2000),
});

condolencesRouter.patch('/:id/own', requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const parsed = ownEditSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const [row] = await db.select().from(condolences).where(eq(condolences.id, id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  if (row.userId !== req.user!.id) return res.status(403).json({ error: 'forbidden' });

  const [updated] = await db.update(condolences)
    .set({ message: parsed.data.message })
    .where(eq(condolences.id, id))
    .returning();
  res.json({ condolence: updated });
});

condolencesRouter.delete('/:id/own', requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const [row] = await db.select().from(condolences).where(eq(condolences.id, id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  if (row.userId !== req.user!.id) return res.status(403).json({ error: 'forbidden' });

  await db.delete(commentReports).where(eq(commentReports.condolenceId, id));
  await db.delete(condolences).where(eq(condolences.id, id));
  res.json({ ok: true });
});

// ---------- Moderator routes ----------

const moderator = [requireAuth, requireRole('moderator', 'admin')];

condolencesRouter.get('/pending', ...moderator, async (_req, res) => {
  const page = Math.max(1, Number(_req.query.page) || 1);
  const limit = Math.min(50, Number(_req.query.limit) || 20);

  const items = await db.select({
    id: condolences.id,
    deceasedId: condolences.deceasedId,
    authorName: condolences.authorName,
    message: condolences.message,
    createdAt: condolences.createdAt,
    status: condolences.status,
  }).from(condolences)
    .where(eq(condolences.status, 'pending'))
    .orderBy(asc(condolences.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  res.json({ items, page, limit });
});

condolencesRouter.get('/reported', ...moderator, async (_req, res) => {
  const page = Math.max(1, Number(_req.query.page) || 1);
  const limit = Math.min(50, Number(_req.query.limit) || 20);

  const items = await db.select({
    reportId: commentReports.id,
    condolenceId: condolences.id,
    reason: commentReports.reason,
    reportedAt: commentReports.createdAt,
    authorName: condolences.authorName,
    message: condolences.message,
    deceasedId: condolences.deceasedId,
    deceasedName: deceased.fullName,
    status: condolences.status,
  }).from(commentReports)
    .innerJoin(condolences, eq(commentReports.condolenceId, condolences.id))
    .innerJoin(deceased, eq(condolences.deceasedId, deceased.id))
    .orderBy(desc(commentReports.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  res.json({ items, page, limit });
});

condolencesRouter.get('/hidden', ...moderator, async (_req, res) => {
  const items = await db.select({
    id: condolences.id,
    deceasedId: condolences.deceasedId,
    authorName: condolences.authorName,
    message: condolences.message,
    createdAt: condolences.createdAt,
    status: condolences.status,
  }).from(condolences)
    .where(eq(condolences.status, 'hidden'))
    .orderBy(desc(condolences.createdAt))
    .limit(50);

  res.json({ items });
});

const editSchema = z.object({
  message: z.string().min(2).max(2000).optional(),
  authorName: z.string().min(2).max(120).optional(),
});

condolencesRouter.patch('/:id', ...moderator, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const parsed = editSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) patch[k] = v;
  }
  if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'nothing_to_update' });

  const [row] = await db.update(condolences)
    .set(patch)
    .where(eq(condolences.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ condolence: row });
});

condolencesRouter.patch('/:id/approve', ...moderator, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const [row] = await db.update(condolences)
    .set({ status: 'verified' })
    .where(eq(condolences.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ condolence: row });
});

condolencesRouter.patch('/:id/reject', ...moderator, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const [row] = await db.update(condolences)
    .set({ status: 'hidden' })
    .where(eq(condolences.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ condolence: row });
});

condolencesRouter.patch('/:id/restore', ...moderator, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const [row] = await db.update(condolences)
    .set({ status: 'verified' })
    .where(eq(condolences.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ condolence: row });
});

condolencesRouter.delete('/:id', ...moderator, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  await db.delete(commentReports).where(eq(commentReports.condolenceId, id));
  await db.delete(condolences).where(eq(condolences.id, id));
  res.json({ ok: true });
});

condolencesRouter.delete('/:id/reports', ...moderator, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  await db.delete(commentReports).where(eq(commentReports.condolenceId, id));
  res.json({ ok: true });
});