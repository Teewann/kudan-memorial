import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { deceased, townPhotos } from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';
import { Bucket } from '@upstash/blob';

export const galleryRouter = Router();

const bucket = Bucket.fromEnv();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// In memory: every verified deceased with a real cloud photo.
// Excludes the old /uploads/... paths that no longer resolve.
galleryRouter.get('/memory', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(60, Number(req.query.limit) || 30);

  const conditions = and(
    eq(deceased.status, 'verified'),
    isNotNull(deceased.photoUrl),
    sql`${deceased.photoUrl} like 'https://%'`,
  );

  const items = await db.select({
    id: deceased.id,
    fullName: deceased.fullName,
    hausaName: deceased.hausaName,
    ward: deceased.ward,
    dateOfDeath: deceased.dateOfDeath,
    photoUrl: deceased.photoUrl,
  }).from(deceased)
    .where(conditions)
    .orderBy(desc(deceased.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(deceased).where(conditions);

  res.json({ items, page, limit, total: Number(count) });
});

// Kudan town: curated photos. Public read, paginated.
galleryRouter.get('/town', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(60, Number(req.query.limit) || 30);

  const items = await db.select({
    id: townPhotos.id,
    title: townPhotos.title,
    description: townPhotos.description,
    photoUrl: townPhotos.photoUrl,
    category: townPhotos.category,
    createdAt: townPhotos.createdAt,
  }).from(townPhotos)
    .orderBy(desc(townPhotos.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(townPhotos);

  res.json({ items, page, limit, total: Number(count) });
});

// Moderator only: upload a town photo.
const createSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(4000).optional(),
  category: z.string().max(60).optional(),
});

galleryRouter.post(
  '/town',
  requireAuth,
  requireRole('moderator', 'admin'),
  upload.single('photo'),
  async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    }

    if (!req.file) return res.status(400).json({ error: 'photo_required' });

    let photoUrl: string | null = null;
    try {
      const ext = req.file.originalname.split('.').pop() || 'jpg';
      const key = `town/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const result = await bucket.put(key, req.file.buffer);
      photoUrl = result.url ?? null;
    } catch (err) {
      console.error('Blob upload failed', err);
      return res.status(500).json({ error: 'photo_upload_failed' });
    }
    if (!photoUrl) return res.status(500).json({ error: 'photo_upload_failed' });

    const [row] = await db.insert(townPhotos).values({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category ?? null,
      photoUrl,
      uploadedByUserId: req.user!.id,
    }).returning();

    res.status(201).json({ photo: row });
  }
);

// Moderator only: delete a town photo.
galleryRouter.delete(
  '/town/:id',
  requireAuth,
  requireRole('moderator', 'admin'),
  async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

    const [row] = await db.delete(townPhotos).where(eq(townPhotos.id, id)).returning();
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  }
);