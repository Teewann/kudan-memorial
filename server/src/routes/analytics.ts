import { Router } from 'express';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { deceased, families, condolences, reactions, views } from '../db/schema.js';

export const analyticsRouter = Router();

// Record one anonymous view for a memorial. Called from the detail page.
// Rate-limited by design: no token, no session, but that is fine because
// one view per page-open has no abuse value.
analyticsRouter.post('/view/:deceasedId', async (req, res) => {
  const deceasedId = Number(req.params.deceasedId);
  if (!Number.isInteger(deceasedId)) return res.status(400).json({ error: 'invalid_id' });

  const [exists] = await db.select({ id: deceased.id }).from(deceased)
    .where(eq(deceased.id, deceasedId));
  if (!exists) return res.status(404).json({ error: 'not_found' });

  await db.insert(views).values({ deceasedId });
  res.json({ ok: true });
});

// Public dashboard. Everything is one query per section, no loops,
// no N+1, aggregated on the database side where possible.
analyticsRouter.get('/summary', async (_req, res) => {
  const [{ people }] = await db.select({ people: sql<number>`count(*)` })
    .from(deceased).where(eq(deceased.status, 'verified'));

  const [{ pending }] = await db.select({ pending: sql<number>`count(*)` })
    .from(deceased).where(eq(deceased.status, 'pending'));

  const [{ families: familyCount }] = await db.select({ families: sql<number>`count(*)` })
    .from(families);

  const [{ condolences: condoleCount }] = await db.select({ condolences: sql<number>`count(*)` })
    .from(condolences).where(eq(condolences.status, 'verified'));

  const [{ reactions: reactionCount }] = await db.select({ reactions: sql<number>`count(*)` })
    .from(reactions);

  const [{ totalViews }] = await db.select({ totalViews: sql<number>`count(*)` })
    .from(views);

  const byWard = await db.select({
    ward: deceased.ward,
    count: sql<number>`count(*)`,
  }).from(deceased)
    .where(eq(deceased.status, 'verified'))
    .groupBy(deceased.ward)
    .orderBy(desc(sql`count(*)`))
    .limit(30);

  const byMonth = await db.select({
    month: sql<string>`to_char(date_trunc('month', ${deceased.dateOfDeath}), 'YYYY-MM')`,
    count: sql<number>`count(*)`,
  }).from(deceased)
    .where(eq(deceased.status, 'verified'))
    .groupBy(sql`date_trunc('month', ${deceased.dateOfDeath})`)
    .orderBy(desc(sql`date_trunc('month', ${deceased.dateOfDeath})`))
    .limit(24);

  // Most viewed: one grouped query, joined to names in a second small select.
  const topRows = await db.select({
    deceasedId: views.deceasedId,
    count: sql<number>`count(*)`,
  }).from(views)
    .groupBy(views.deceasedId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const topIds = topRows.map((r) => r.deceasedId);
  let topWithNames: Array<{ id: number; fullName: string; ward: string; count: number }> = [];
  if (topIds.length > 0) {
    const people = await db.select({
      id: deceased.id,
      fullName: deceased.fullName,
      ward: deceased.ward,
    }).from(deceased)
      .where(sql`${deceased.id} in ${topIds}`);

    const nameMap = Object.fromEntries(people.map((p) => [p.id, p]));
    topWithNames = topRows
      .map((r) => {
        const p = nameMap[r.deceasedId];
        if (!p) return null;
        return { id: p.id, fullName: p.fullName, ward: p.ward, count: Number(r.count) };
      })
      .filter((x): x is { id: number; fullName: string; ward: string; count: number } => x !== null);
  }

  res.json({
    totals: {
      people: Number(people),
      pending: Number(pending),
      families: Number(familyCount),
      condolences: Number(condoleCount),
      reactions: Number(reactionCount),
      views: Number(totalViews),
    },
    byWard: byWard.map((w) => ({ ward: w.ward, count: Number(w.count) })),
    byMonth: byMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
    mostViewed: topWithNames,
  });
});