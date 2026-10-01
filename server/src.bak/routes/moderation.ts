import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { deceased } from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';

export const moderationRouter = Router();

moderationRouter.use(requireAuth, requireRole('moderator', 'admin'));

moderationRouter.get('/pending', async (_req, res) => {
  const rows = await db.select().from(deceased)
    .where(eq(deceased.status, 'pending'))
    .orderBy(desc(deceased.createdAt));
  res.json({ items: rows });
});

moderationRouter.patch('/:id/approve', async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const [row] = await db.update(deceased)
    .set({ status: 'verified', verifiedByUserId: req.user!.id })
    .where(eq(deceased.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ person: row });
});

// Reject sets status to "hidden" (a real value in the status enum).
// The entry stays in the database but never appears publicly.
moderationRouter.patch('/:id/reject', async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const [row] = await db.update(deceased)
    .set({ status: 'hidden' })
    .where(eq(deceased.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ person: row });
});