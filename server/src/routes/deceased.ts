import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { z } from 'zod';
import { and, desc, asc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { deceased, families } from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

export const deceasedRouter = Router();

// Dev-only disk storage. In production this is swapped for an R2/S3 upload
// (see TODO below), never ship base64 images through the API, it kills
// list-endpoint performance.
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB, client already compresses before upload
});
// TODO (production): replace multer.diskStorage with an S3-compatible client
// pointed at Cloudflare R2, and store the returned public URL in photoUrl.

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['newest', 'oldest', 'dod_newest', 'dod_oldest', 'name']).default('newest'),
  ward: z.string().optional(),
  year: z.coerce.number().int().optional(),
  q: z.string().optional(),
});

// Every list endpoint paginates, no exceptions, no unbounded findMany.
deceasedRouter.get('/', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_query' });
  const { page, limit, sort, ward, year, q } = parsed.data;

  const conditions = [eq(deceased.status, 'verified')];
  if (ward) conditions.push(eq(deceased.ward, ward));
  if (year) conditions.push(sql`extract(year from ${deceased.dateOfDeath}) = ${year}`);
  if (q) conditions.push(ilike(deceased.fullName, `%${q}%`));

  const orderBy =
    sort === 'oldest' ? asc(deceased.createdAt) :
    sort === 'dod_newest' ? desc(deceased.dateOfDeath) :
    sort === 'dod_oldest' ? asc(deceased.dateOfDeath) :
    sort === 'name' ? asc(deceased.fullName) :
    desc(deceased.createdAt); // "newest" = most recently recorded, default

  const rows = await db.select().from(deceased)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(deceased).where(and(...conditions));

  res.json({ items: rows, page, limit, total: Number(count) });
});

// On this day: anyone whose death anniversary falls on today's day and
// month, across all years. Capped at 20. Must be declared BEFORE /:id,
// otherwise Express treats "on-this-day" as an id and returns invalid_id.
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

// No account needed, this stays open to anyone. Rate-limited and still
// moderated (status starts "pending") so it can't be used to flood the
// register with junk.
const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

deceasedRouter.post('/', submitLimiter, upload.single('photo'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const [row] = await db.insert(deceased).values({
    ...parsed.data,
    photoUrl,
    status: 'pending', // moderators verify before it appears publicly
  }).returning();

  res.status(201).json({ person: row });
});

// Moderator/admin only, never trust the client for permissions.
deceasedRouter.patch('/:id/verify', requireAuth, requireRole('moderator', 'admin'), async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const [row] = await db.update(deceased)
    .set({ status: 'verified', verifiedByUserId: req.user!.id })
    .where(eq(deceased.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ person: row });
});