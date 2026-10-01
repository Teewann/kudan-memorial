import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { reactions, deceased } from '../db/schema.js';

export const reactionsRouter = Router();

// Returns counts for one memorial plus this visitor's current reaction.
// visitorToken is passed as a query param so the browser can remember it.
reactionsRouter.get('/deceased/:id', async (req, res) => {
  const deceasedId = Number(req.params.id);
  if (!Number.isInteger(deceasedId)) return res.status(400).json({ error: 'invalid_id' });

  const visitorToken = String(req.query.visitorToken ?? '').slice(0, 64);

  const counts = await db.select({
    kind: reactions.kind,
    count: sql<number>`count(*)`,
  }).from(reactions)
    .where(eq(reactions.deceasedId, deceasedId))
    .groupBy(reactions.kind);

  const totals: Record<string, number> = { remember: 0, pray: 0 };
  for (const c of counts) totals[c.kind] = Number(c.count);

  let mine: string | null = null;
  if (visitorToken) {
    const [row] = await db.select({ kind: reactions.kind }).from(reactions)
      .where(and(
        eq(reactions.deceasedId, deceasedId),
        eq(reactions.visitorToken, visitorToken),
      ));
    if (row) mine = row.kind;
  }

  res.json({ totals, mine });
});

const submitLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

const bodySchema = z.object({
  kind: z.enum(['remember', 'pray']),
  visitorToken: z.string().min(8).max(64),
});

// Tap once to react. Tap the same kind again to remove your reaction.
// Tap the other kind to switch. Only one reaction per visitor per memorial.
reactionsRouter.post('/deceased/:id', submitLimiter, async (req, res) => {
  const deceasedId = Number(req.params.id);
  if (!Number.isInteger(deceasedId)) return res.status(400).json({ error: 'invalid_id' });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const [person] = await db.select({ id: deceased.id }).from(deceased)
    .where(eq(deceased.id, deceasedId));
  if (!person) return res.status(404).json({ error: 'not_found' });

  const { kind, visitorToken } = parsed.data;

  const [existing] = await db.select().from(reactions)
    .where(and(
      eq(reactions.deceasedId, deceasedId),
      eq(reactions.visitorToken, visitorToken),
    ));

  if (existing && existing.kind === kind) {
    // Same tap, remove it.
    await db.delete(reactions).where(eq(reactions.id, existing.id));
  } else if (existing) {
    // Different tap, switch.
    await db.update(reactions).set({ kind }).where(eq(reactions.id, existing.id));
  } else {
    // New reaction.
    await db.insert(reactions).values({ deceasedId, kind, visitorToken });
  }

  // Recompute totals to return the fresh state.
  const counts = await db.select({
    kind: reactions.kind,
    count: sql<number>`count(*)`,
  }).from(reactions)
    .where(eq(reactions.deceasedId, deceasedId))
    .groupBy(reactions.kind);

  const totals: Record<string, number> = { remember: 0, pray: 0 };
  for (const c of counts) totals[c.kind] = Number(c.count);

  const [current] = await db.select({ kind: reactions.kind }).from(reactions)
    .where(and(
      eq(reactions.deceasedId, deceasedId),
      eq(reactions.visitorToken, visitorToken),
    ));

  res.json({ totals, mine: current?.kind ?? null });
});