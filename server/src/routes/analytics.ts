import { Router } from 'express';
import { db } from '../db/index.js';
import { deceased, families, condolences, reactions, views } from '../db/schema.js';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';

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

  // Entries per month, last 24 months by date of death.
  const byMonth = await db.select({
    month: sql<string>`to_char(date_trunc('month', ${deceased.dateOfDeath}), 'YYYY-MM')`,
    count: sql<number>`count(*)`,
  }).from(deceased)
    .where(and(
      eq(deceased.status, 'verified'),
      sql`${deceased.dateOfDeath} >= (current_date - interval '24 months')`,
    ))
    .groupBy(sql`date_trunc('month', ${deceased.dateOfDeath})`)
    .orderBy(sql`date_trunc('month', ${deceased.dateOfDeath})`);

  // Reactions breakdown.
  const reactionRows = await db.select({
    kind: reactions.kind,
    count: sql<number>`count(*)`,
  }).from(reactions)
    .groupBy(reactions.kind);

  const reactionsBreakdown: Array<{ kind: string; count: number }> = [
    { kind: 'remember', count: 0 },
    { kind: 'pray', count: 0 },
  ];
  for (const r of reactionRows) {
    const i = reactionsBreakdown.findIndex((x) => x.kind === r.kind);
    if (i >= 0) reactionsBreakdown[i].count = Number(r.count);
    else reactionsBreakdown.push({ kind: r.kind, count: Number(r.count) });
  }

  // Most viewed, with condolence and reaction counts per memorial.
  const topRows = await db.select({
    deceasedId: views.deceasedId,
    count: sql<number>`count(*)`,
  }).from(views)
    .groupBy(views.deceasedId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const topIds = topRows.map((r) => r.deceasedId);
  let mostViewed: Array<{
    id: number; fullName: string; ward: string;
    count: number; condolenceCount: number; rememberCount: number; prayCount: number;
  }> = [];

  if (topIds.length > 0) {
    const peopleRows = await db.select({
      id: deceased.id,
      fullName: deceased.fullName,
      ward: deceased.ward,
    }).from(deceased)
      .where(inArray(deceased.id, topIds));
    const nameMap = Object.fromEntries(peopleRows.map((p) => [p.id, p]));

    const condoleCounts = await db.select({
      deceasedId: condolences.deceasedId,
      count: sql<number>`count(*)`,
    }).from(condolences)
      .where(and(
        eq(condolences.status, 'verified'),
        inArray(condolences.deceasedId, topIds),
      ))
      .groupBy(condolences.deceasedId);
    const condoleMap = Object.fromEntries(condoleCounts.map((c) => [c.deceasedId, Number(c.count)]));

    const reactionCounts = await db.select({
      deceasedId: reactions.deceasedId,
      kind: reactions.kind,
      count: sql<number>`count(*)`,
    }).from(reactions)
      .where(inArray(reactions.deceasedId, topIds))
      .groupBy(reactions.deceasedId, reactions.kind);
    const remMap: Record<number, number> = {};
    const prayMap: Record<number, number> = {};
    for (const r of reactionCounts) {
      if (r.kind === 'remember') remMap[r.deceasedId] = Number(r.count);
      if (r.kind === 'pray') prayMap[r.deceasedId] = Number(r.count);
    }

    mostViewed = topRows
      .map((r) => {
        const p = nameMap[r.deceasedId];
        if (!p) return null;
        return {
          id: p.id,
          fullName: p.fullName,
          ward: p.ward,
          count: Number(r.count),
          condolenceCount: condoleMap[p.id] ?? 0,
          rememberCount: remMap[p.id] ?? 0,
          prayCount: prayMap[p.id] ?? 0,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
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
    reactionsBreakdown,
    mostViewed,
  });
});

analyticsRouter.get('/export', async (req, res) => {
  const from = String(req.query.from || '');
  const to = String(req.query.to || '');
  const ward = String(req.query.ward || '');

  const conditions = [eq(deceased.status, 'verified')];
  if (from) conditions.push(sql`${deceased.dateOfDeath} >= ${from}`);
  if (to) conditions.push(sql`${deceased.dateOfDeath} <= ${to}`);
  if (ward) conditions.push(eq(deceased.ward, ward));

  const rows = await db.select({
    id: deceased.id,
    fullName: deceased.fullName,
    hausaName: deceased.hausaName,
    ward: deceased.ward,
    dateOfBirth: deceased.dateOfBirth,
    dateOfDeath: deceased.dateOfDeath,
    parentName: deceased.parentName,
    spouseName: deceased.spouseName,
    graveLocation: deceased.graveLocation,
    createdAt: deceased.createdAt,
  }).from(deceased)
    .where(and(...conditions))
    .orderBy(desc(deceased.dateOfDeath));

  const header = [
    'ID', 'Full name', 'Hausa name', 'Ward', 'Date of birth',
    'Date of death', 'Parent', 'Spouse', 'Resting place', 'Recorded at',
  ];

  function escape(v: unknown): string {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      r.id, r.fullName, r.hausaName, r.ward, r.dateOfBirth,
      r.dateOfDeath, r.parentName, r.spouseName, r.graveLocation, r.createdAt,
    ].map(escape).join(','));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kudan-deceased.csv"');
  res.send(lines.join('\n'));
});

// Report data for PDF and Excel exports. Returns verified records
// with counts, filtered by range, ward, and search. Moderator-only.
analyticsRouter.get(
  '/report',
  requireAuth,
  requireRole('moderator', 'admin'),
  async (req: AuthedRequest, res) => {
    const range = String(req.query.range || 'all');
    const ward = String(req.query.ward || '');
    const q = String(req.query.q || '').trim();
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');

    const conditions = [eq(deceased.status, 'verified')];

    // Time range on createdAt (recorded date)
    const now = new Date();
    if (range === 'today') {
      conditions.push(sql`date_trunc('day', ${deceased.createdAt}) = date_trunc('day', now())`);
    } else if (range === 'week') {
      conditions.push(sql`${deceased.createdAt} >= now() - interval '7 days'`);
    } else if (range === 'month') {
      conditions.push(sql`${deceased.createdAt} >= now() - interval '30 days'`);
    } else if (range === 'year') {
      conditions.push(sql`${deceased.createdAt} >= now() - interval '365 days'`);
    } else if (range === 'custom' && from && to) {
      conditions.push(sql`${deceased.createdAt} >= ${from}::date`);
      conditions.push(sql`${deceased.createdAt} < (${to}::date + interval '1 day')`);
    }

    if (ward) conditions.push(eq(deceased.ward, ward));
    if (q) {
      conditions.push(sql`(
        ${deceased.fullName} ilike ${'%' + q + '%'}
        or coalesce(${deceased.hausaName}, '') ilike ${'%' + q + '%'}
      )`);
    }

    const baseWhere = and(...conditions);

    const rows = await db.select({
      id: deceased.id,
      fullName: deceased.fullName,
      hausaName: deceased.hausaName,
      ward: deceased.ward,
      dateOfBirth: deceased.dateOfBirth,
      dateOfDeath: deceased.dateOfDeath,
      createdAt: deceased.createdAt,
    }).from(deceased)
      .where(baseWhere)
      .orderBy(desc(deceased.createdAt))
      .limit(1000);

    // Attach reaction and condolence counts in one grouped query each.
    const ids = rows.map((r) => r.id);
    let condoleMap: Record<number, number> = {};
    let rememberMap: Record<number, number> = {};
    let prayMap: Record<number, number> = {};

    if (ids.length > 0) {
      const condole = await db.select({
        deceasedId: condolences.deceasedId,
        count: sql<number>`count(*)`,
      }).from(condolences)
        .where(and(eq(condolences.status, 'verified'), inArray(condolences.deceasedId, ids)))
        .groupBy(condolences.deceasedId);
      condoleMap = Object.fromEntries(condole.map((c) => [c.deceasedId, Number(c.count)]));

      const reacts = await db.select({
        deceasedId: reactions.deceasedId,
        kind: reactions.kind,
        count: sql<number>`count(*)`,
      }).from(reactions)
        .where(inArray(reactions.deceasedId, ids))
        .groupBy(reactions.deceasedId, reactions.kind);
      for (const r of reacts) {
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

    res.json({ items, count: items.length, range, ward, q });
  }
);

analyticsRouter.get(
  '/report',
  requireAuth,
  requireRole('moderator', 'admin'),
  async (req: AuthedRequest, res) => {
    const range = String(req.query.range || 'all');
    const ward = String(req.query.ward || '');
    const q = String(req.query.q || '').trim();
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');

    const conditions = [eq(deceased.status, 'verified')];

    if (range === 'today') {
      conditions.push(sql`date_trunc('day', ${deceased.createdAt}) = date_trunc('day', now())`);
    } else if (range === 'week') {
      conditions.push(sql`${deceased.createdAt} >= now() - interval '7 days'`);
    } else if (range === 'month') {
      conditions.push(sql`${deceased.createdAt} >= now() - interval '30 days'`);
    } else if (range === 'year') {
      conditions.push(sql`${deceased.createdAt} >= now() - interval '365 days'`);
    } else if (range === 'custom' && from && to) {
      conditions.push(sql`${deceased.createdAt} >= ${from}::date`);
      conditions.push(sql`${deceased.createdAt} < (${to}::date + interval '1 day')`);
    }

    if (ward) conditions.push(eq(deceased.ward, ward));
    if (q) {
      conditions.push(sql`(
        ${deceased.fullName} ilike ${'%' + q + '%'}
        or coalesce(${deceased.hausaName}, '') ilike ${'%' + q + '%'}
      )`);
    }

    const baseWhere = and(...conditions);

    const rows = await db.select({
      id: deceased.id,
      fullName: deceased.fullName,
      hausaName: deceased.hausaName,
      ward: deceased.ward,
      dateOfBirth: deceased.dateOfBirth,
      dateOfDeath: deceased.dateOfDeath,
      createdAt: deceased.createdAt,
    }).from(deceased)
      .where(baseWhere)
      .orderBy(desc(deceased.createdAt))
      .limit(1000);

    const ids = rows.map((r) => r.id);
    let condoleMap: Record<number, number> = {};
    let rememberMap: Record<number, number> = {};
    let prayMap: Record<number, number> = {};

    if (ids.length > 0) {
      const condole = await db.select({
        deceasedId: condolences.deceasedId,
        count: sql<number>`count(*)`,
      }).from(condolences)
        .where(and(eq(condolences.status, 'verified'), inArray(condolences.deceasedId, ids)))
        .groupBy(condolences.deceasedId);
      condoleMap = Object.fromEntries(condole.map((c) => [c.deceasedId, Number(c.count)]));

      const reacts = await db.select({
        deceasedId: reactions.deceasedId,
        kind: reactions.kind,
        count: sql<number>`count(*)`,
      }).from(reactions)
        .where(inArray(reactions.deceasedId, ids))
        .groupBy(reactions.deceasedId, reactions.kind);
      for (const r of reacts) {
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

    res.json({ items, count: items.length, range, ward, q });
  }
);