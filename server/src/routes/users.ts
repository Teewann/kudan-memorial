import { Router } from 'express';
import { z } from 'zod';
import { asc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';

export const usersRouter = Router();

// Moderators and admins can both see this tab.
usersRouter.use(requireAuth, requireRole('moderator', 'admin'));

// List users, paginated, with optional search by name or phone.
usersRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const q = String(req.query.q || '').trim();

  const conditions = [];
  if (q) {
    conditions.push(or(
      ilike(users.name, `%${q}%`),
      ilike(users.phone, `%${q}%`),
    ));
  }

  const where = conditions.length ? sql`${sql.join(conditions, sql` and `)}` : undefined;

  const items = await db.select({
    id: users.id,
    name: users.name,
    phone: users.phone,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users)
    .where(where)
    .orderBy(asc(users.name))
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(where);

  res.json({ items, page, limit, total: Number(count) });
});

// Change a user's role.
// Rules:
//   - Nobody can demote themselves.
//   - A moderator can only set member or moderator (not admin).
//   - An admin can set any role on anyone, but still not their own to a lower one.
const roleSchema = z.object({
  role: z.enum(['member', 'moderator', 'admin']),
});

usersRouter.patch('/:id/role', async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const myRole = req.user!.role;

  if (id === req.user!.id && parsed.data.role !== myRole) {
    return res.status(400).json({ error: 'cannot_demote_self' });
  }

  if (myRole === 'moderator' && parsed.data.role === 'admin') {
    return res.status(403).json({ error: 'cannot_promote_admin' });
  }

  const [row] = await db.update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, id))
    .returning({
      id: users.id, name: users.name, phone: users.phone, role: users.role,
    });

  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ user: row });
});