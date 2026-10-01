import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { condolences, deceased } from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';

export const condolencesRouter = Router();

// Public list of approved condolences for one person, paginated.
// Newest first. Hard cap of 50 per page, no exceptions.
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
  }).from(condolences)
    .where(conditions)
    .orderBy(desc(condolences.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(condolences).where(conditions);

  res.json({ items, page, limit, total: Number(count) });
});

// Public submit. Starts as "pending". Rate limited so it cannot be used
// to flood the database.
const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

const createSchema = z.object({
  authorName: z.string().min(2).max(120),
  message: z.string().min(2).max(2000),
});

condolencesRouter.post('/deceased/:id', submitLimiter, async (req, res) => {
  const deceasedId = Number(req.params.id);
  if (!Number.isInteger(deceasedId)) return res.status(400).json({ error: 'invalid_id' });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const [person] = await db.select({ id: deceased.id }).from(deceased)
    .where(eq(deceased.id, deceasedId));
  if (!person) return res.status(404).json({ error: 'not_found' });

  const [row] = await db.insert(condolences).values({
    deceasedId,
    ...parsed.data,
    status: 'pending',
  }).returning();

  res.status(201).json({ condolence: row });
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
  }).from(condolences)
    .where(eq(condolences.status, 'pending'))
    .orderBy(asc(condolences.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  res.json({ items, page, limit });
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