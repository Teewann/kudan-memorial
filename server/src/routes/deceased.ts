import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { and, desc, asc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { deceased, families, condolences, reactions } from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { Bucket } from '@upstash/blob';

export const deceasedRouter = Router();

const bucket = Bucket.fromEnv();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['newest', 'oldest', 'dod_newest', 'dod_oldest', 'name']).default('newest'),
  ward: z.string().optional(),
  year: z.coerce.number().int().optional(),
  q: z.string().optional(),
});

deceasedRouter.get('/', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_query' });
  const { page, limit, sort, ward, year, q } = parsed.data;

  const conditions = [eq(deceased.status, 'verified')];
  if (ward) conditions.push(eq(deceased.ward, ward));
  if (year) conditions.push(sql`extract(year from ${deceased.dateOfDeath}) = ${year}`);
  if (q) {
    conditions.push(sql`(
      ${deceased.fullName} ilike ${'%' + q + '%'}
      or coalesce(${deceased.hausaName}, '') ilike ${'%' + q + '%'}
    )`);
  }

  const orderBy =
    sort === 'oldest' ? asc(deceased.createdAt) :
    sort === 'dod_newest' ? desc(deceased.dateOfDeath) :
    sort === 'dod_oldest' ? asc(deceased.dateOfDeath) :
    sort === 'name' ? asc(deceased.fullName) :
    desc(deceased.createdAt);

  const rows = await db.select().from(deceased)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(deceased).where(and(...conditions));

  res.json({ items: rows, page, limit, total: Number(count) });
});

deceasedRouter.get('/feed', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(20, Number(req.query.limit) || 10);
  const ward = typeof req.query.ward === 'string' ? req.query.ward : '';

  const baseWhere = ward
    ? and(eq(deceased.status, 'verified'), eq(deceased.ward, ward))
    : eq(deceased.status, 'verified');

  const rows = await db.select({
    id: deceased.id,
    fullName: deceased.fullName,
    hausaName: deceased.hausaName,
    ward: deceased.ward,
    dateOfBirth: deceased.dateOfBirth,
    dateOfDeath: deceased.dateOfDeath,
    bio: deceased.bio,
    photoUrl: deceased.photoUrl,
    graveLocation: deceased.graveLocation,
    parentName: deceased.parentName,
    spouseName: deceased.spouseName,
    submittedByName: deceased.submittedByName,
    createdAt: deceased.createdAt,
  }).from(deceased)
    .where(baseWhere)
    .orderBy(desc(deceased.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const ids = rows.map((r) => r.id);
  let condoleMap: Record<number, number> = {};
  let rememberMap: Record<number, number> = {};
  let prayMap: Record<number, number> = {};

  if (ids.length > 0) {
    const condoleCounts = await db.select({
      deceasedId: condolences.deceasedId,
      count: sql<number>`count(*)`,
    }).from(condolences)
      .where(and(eq(condolences.status, 'verified'), inArray(condolences.deceasedId, ids)))
      .groupBy(condolences.deceasedId);
    condoleMap = Object.fromEntries(condoleCounts.map((c) => [c.deceasedId, Number(c.count)]));

    const reactionCounts = await db.select({
      deceasedId: reactions.deceasedId,
      kind: reactions.kind,
      count: sql<number>`count(*)`,
    }).from(reactions)
      .where(inArray(reactions.deceasedId, ids))
      .groupBy(reactions.deceasedId, reactions.kind);

    for (const r of reactionCounts) {
      if (r.kind === 'remember') rememberMap[r.deceasedId] = Number(r.count);
      if (r.kind === 'pray') prayMap[r.deceasedId] = Number(r.count);
    }
  }

  const items = rows.map((r) => ({
    ...r,
    condolenceCount: condoleMap[r.id] ?? 0,
    rememberCount: rememberMap[r.id] ?? 0,
    prayCount: prayMap[r.id] ?? 0,
  }));

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(deceased).where(baseWhere);

  res.json({ items, page, limit, total: Number(count), hasMore: page * limit < Number(count) });
});

deceasedRouter.get('/stats', async (_req, res) => {
  const [{ people }] = await db.select({ people: sql<number>`count(*)` })
    .from(deceased).where(eq(deceased.status, 'verified'));

  const [{ families: familyCount }] = await db.select({ families: sql<number>`count(*)` })
    .from(families);

  const [{ messages }] = await db.select({ messages: sql<number>`count(*)` })
    .from(condolences).where(eq(condolences.status, 'verified'));

  const [{ reactions: reactionCount }] = await db.select({ reactions: sql<number>`count(*)` })
    .from(reactions);

  const [{ thisMonth }] = await db.select({ thisMonth: sql<number>`count(*)` })
    .from(deceased)
    .where(and(
      eq(deceased.status, 'verified'),
      sql`date_trunc('month', ${deceased.createdAt}) = date_trunc('month', current_date)`,
    ));

  const [{ today }] = await db.select({ today: sql<number>`count(*)` })
    .from(deceased)
    .where(and(
      eq(deceased.status, 'verified'),
      sql`date_trunc('day', ${deceased.createdAt}) = date_trunc('day', current_date)`,
    ));

  const [{ pending }] = await db.select({ pending: sql<number>`count(*)` })
    .from(deceased).where(eq(deceased.status, 'pending'));

  res.json({
    people: Number(people),
    families: Number(familyCount),
    condolences: Number(messages),
    reactions: Number(reactionCount),
    thisMonth: Number(thisMonth),
    today: Number(today),
    pending: Number(pending),
  });
});

deceasedRouter.get('/on-this-day', async (_req, res) => {
  const rows = await db.select({
    id: deceased.id,
    fullName: deceased.fullName,
    ward: deceased.ward,
    dateOfDeath: deceased.dateOfDeath,
    photoUrl: deceased.photoUrl,
  }).from(deceased)
    .where(sql`
      ${deceased.status} = 'verified'
      and extract(month from ${deceased.dateOfDeath}) = extract(month from current_date)
      and extract(day   from ${deceased.dateOfDeath}) = extract(day   from current_date)
    `)
    .orderBy(desc(deceased.dateOfDeath))
    .limit(20);

  res.json({ items: rows });
});

deceasedRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const [person] = await db.select().from(deceased).where(eq(deceased.id, id));
  if (!person) return res.status(404).json({ error: 'not_found' });

  const family = person.familyId
    ? (await db.select().from(families).where(eq(families.id, person.familyId)))[0]
    : null;

  res.json({ person, family });
});

const createSchema = z.object({
  fullName: z.string().min(2).max(160),
  hausaName: z.string().max(160).optional(),
  sex: z.enum(['male', 'female']).optional(),
  ward: z.string().min(2).max(120),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string(),
  bio: z.string().max(4000).optional(),
  graveLocation: z.string().max(400).optional(),
  parentName: z.string().max(160).optional(),
  spouseName: z.string().max(160).optional(),
  familyId: z.coerce.number().int().optional(),
  submittedByName: z.string().min(2).max(160),
  submittedByPhone: z.string().min(6).max(40),
});

function nullify<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === undefined ? null : v;
  return out;
}

const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

deceasedRouter.post('/', submitLimiter, upload.single('photo'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  let photoUrl: string | null = null;
  if (req.file) {
    try {
      const ext = req.file.originalname.split('.').pop() || 'jpg';
      const key = `deceased/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const result = await bucket.put(key, req.file.buffer);
      photoUrl = result.url ?? null;
    } catch (err) {
      console.error('Blob upload failed', err);
      return res.status(500).json({ error: 'photo_upload_failed' });
    }
  }

  const [row] = await db.insert(deceased).values({
    ...nullify(parsed.data),
    photoUrl,
    status: 'pending',
  } as typeof deceased.$inferInsert).returning();

  res.status(201).json({ person: row });
});

deceasedRouter.patch('/:id/verify', requireAuth, requireRole('moderator', 'admin'), async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const [row] = await db.update(deceased)
    .set({ status: 'verified', verifiedByUserId: req.user!.id })
    .where(eq(deceased.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ person: row });
});

const updateSchema = z.object({
  fullName: z.string().min(2).max(160).optional(),
  hausaName: z.string().max(160).nullable().optional(),
  sex: z.enum(['male', 'female']).nullable().optional(),
  ward: z.string().min(2).max(120).optional(),
  dateOfBirth: z.string().nullable().optional(),
  dateOfDeath: z.string().optional(),
  bio: z.string().max(4000).nullable().optional(),
  graveLocation: z.string().max(400).nullable().optional(),
  parentName: z.string().max(160).nullable().optional(),
  spouseName: z.string().max(160).nullable().optional(),
  familyId: z.coerce.number().int().nullable().optional(),
  submittedByName: z.string().min(2).max(160).optional(),
  submittedByPhone: z.string().min(6).max(40).optional(),
  status: z.enum(['pending', 'verified', 'hidden']).optional(),
});

deceasedRouter.patch(
  '/:id',
  requireAuth,
  requireRole('moderator', 'admin'),
  async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    }

    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) patch[k] = v;
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'nothing_to_update' });
    }

    const [row] = await db.update(deceased)
      .set(patch)
      .where(eq(deceased.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json({ person: row });
  }
);

deceasedRouter.delete(
  '/:id',
  requireAuth,
  requireRole('moderator', 'admin'),
  async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

    await db.delete(condolences).where(eq(condolences.deceasedId, id));
    await db.delete(reactions).where(eq(reactions.deceasedId, id));

    const [row] = await db.delete(deceased).where(eq(deceased.id, id)).returning();
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  }
);