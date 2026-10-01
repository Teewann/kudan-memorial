import { Router } from 'express';
import { z } from 'zod';
import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { families, familyMembers, deceased } from '../db/schema.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const familiesRouter = Router();

familiesRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const rows = await db.select({
    id: families.id,
    name: families.name,
    ward: families.ward,
    headName: families.headName,
    memberCount: sql<number>`count(${familyMembers.id})`,
  }).from(families)
    .leftJoin(familyMembers, eq(familyMembers.familyId, families.id))
    .groupBy(families.id)
    .orderBy(desc(families.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  res.json({ items: rows, page, limit });
});

familiesRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const [family] = await db.select().from(families).where(eq(families.id, id));
  if (!family) return res.status(404).json({ error: 'not_found' });

  const members = await db.select().from(familyMembers)
    .where(eq(familyMembers.familyId, id))
    .orderBy(familyMembers.name);

  const deceasedMembers = await db.select().from(deceased)
    .where(eq(deceased.familyId, id))
    .orderBy(desc(deceased.dateOfDeath));

  res.json({ family, members, deceasedMembers });
});

const createSchema = z.object({
  name: z.string().min(2).max(160),
  headName: z.string().max(160).optional(),
  ward: z.string().min(2).max(120),
  phone: z.string().max(40).optional(),
  history: z.string().max(4000).optional(),
});

familiesRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const [row] = await db.insert(families).values({
    ...parsed.data,
    ownerUserId: req.user!.id,
  }).returning();

  res.status(201).json({ family: row });
});

// ---------- Family members ----------

const memberSchema = z.object({
  name: z.string().min(2).max(160),
  relation: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  photoUrl: z.string().max(400).optional(),
});

// Add a living member to a family. Requires login.
familiesRouter.post('/:id/members', requireAuth, async (req: AuthedRequest, res) => {
  const familyId = Number(req.params.id);
  if (!Number.isInteger(familyId)) return res.status(400).json({ error: 'invalid_id' });

  const parsed = memberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  const [row] = await db.insert(familyMembers).values({
    familyId,
    ...parsed.data,
  }).returning();

  res.status(201).json({ member: row });
});

// Remove a living member. Requires login.
familiesRouter.delete('/:id/members/:memberId', requireAuth, async (req: AuthedRequest, res) => {
  const memberId = Number(req.params.memberId);
  if (!Number.isInteger(memberId)) return res.status(400).json({ error: 'invalid_id' });

  await db.delete(familyMembers).where(eq(familyMembers.id, memberId));
  res.json({ ok: true });
});