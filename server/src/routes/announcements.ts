import { Router } from 'express';
import { z } from 'zod';
import { desc, gt, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { announcements } from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';

export const announcementsRouter = Router();

// Public list. Only shows announcements that have not expired.
// Paginated, hard cap 50 per page.
announcementsRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const items = await db.select({
    id: announcements.id,
    name: announcements.name,
    dateOfDeath: announcements.dateOfDeath,
    note: announcements.note,
    burialTime: announcements.burialTime,
    burialPlace: announcements.burialPlace,
    createdAt: announcements.createdAt,
    expiresAt: announcements.expiresAt,
  }).from(announcements)
    .where(gt(announcements.expiresAt, new Date()))
    .orderBy(desc(announcements.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  res.json({ items, page, limit });
});

announcementsRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const [row] = await db.select().from(announcements).where(eq(announcements.id, id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ announcement: row });
});

const createSchema = z.object({
  name: z.string().min(2).max(160),
  dateOfDeath: z.string(),
  note: z.string().max(4000).optional(),
  burialTime: z.string().max(80).optional(),
  burialPlace: z.string().max(200).optional(),
  // Number of days the announcement stays visible. Default 30.
  daysVisible: z.coerce.number().int().min(1).max(365).default(30),
});

// Moderator or admin only. Announcements are official notices, so they
// are not open to the public like deceased submissions are.
announcementsRouter.post(
  '/',
  requireAuth,
  requireRole('moderator', 'admin'),
  async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

    const { daysVisible, ...rest } = parsed.data;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysVisible);

    const [row] = await db.insert(announcements).values({
      ...rest,
      expiresAt,
    }).returning();

    res.status(201).json({ announcement: row });
  }
);

announcementsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('moderator', 'admin'),
  async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

    await db.delete(announcements).where(eq(announcements.id, id));
    res.json({ ok: true });
  }
);