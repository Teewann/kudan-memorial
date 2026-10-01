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
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/deceased', deceasedRouter);
app.use('/api/families', familiesRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/condolences', condolencesRouter);
app.use('/api/announcements', announcementsRouter);
// Always return a real error type, never a bare "Server error" with no
// context, or debugging becomes guesswork.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({
    error: err.code ?? 'internal_error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Kudan Memorial API listening on :${port}`));