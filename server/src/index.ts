import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { authRouter } from './routes/auth.js';
import { deceasedRouter } from './routes/deceased.js';
import { familiesRouter } from './routes/families.js';
import { moderationRouter } from './routes/moderation.js';
import { condolencesRouter } from './routes/condolences.js';
import { announcementsRouter } from './routes/announcements.js';
import { reactionsRouter } from './routes/reactions.js';
import { analyticsRouter } from './routes/analytics.js';
import { usersRouter } from './routes/users.js';
import { galleryRouter } from './routes/gallery.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));

// Log every request path in dev, so we can see exactly what the server got.
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/deceased', deceasedRouter);
app.use('/api/families', familiesRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/condolences', condolencesRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/reactions', reactionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/users', usersRouter);
app.use('/api/gallery', galleryRouter);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({
    error: err.code ?? 'internal_error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Kudan Memorial API listening on :${port}`));