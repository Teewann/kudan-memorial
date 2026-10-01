import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { and, desc, asc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { deceased, families } from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { Bucket } from '@upstash/blob';

export const deceasedRouter = Router();

// Photos are stored in Upstash Blob (public bucket). The URL is a permanent
// CDN link, so it survives every Render deploy (unlike local disk, which is
// wiped on each redeploy).
const bucket = Bucket.fromEnv();

// multer in memory, so the file never touches the server disk.
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
  if (q) conditions.push(ilike(deceased.fullName, `%${q}%`));

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
      const { url } = await bucket.put(key, req.file.buffer);
      photoUrl = url;
    } catch (err) {
      console.error('Blob upload failed', err);
      return res.status(500).json({ error: 'photo_upload_failed' });
    }
  }

  const [row] = await db.insert(deceased).values({
    ...parsed.data,
    photoUrl,
    status: 'pending',
  }).returning();

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