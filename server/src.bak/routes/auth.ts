import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const authRouter = Router();

// Only needed to register a family. Phone + password only — no username,
// no email required to sign up or log in (email is optional, kept for
// possible future use and nothing else).
const registerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(40),
  email: z.string().email().optional(),
  password: z.string().min(4), // kept short on purpose — simple passwords like "1234" are fine here
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }
  const { name, phone, email, password } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone));
  if (existing.length > 0) return res.status(409).json({ error: 'phone_taken' });

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({ name, phone, email, passwordHash }).returning({
    id: users.id, name: users.name, phone: users.phone, role: users.role,
  });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '30d' });
  res.status(201).json({ user, token });
});

const loginSchema = z.object({ phone: z.string().min(6).max(40), password: z.string() });

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const [user] = await db.select().from(users).where(eq(users.phone, parsed.data.phone));
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '30d' });
  res.json({
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    token,
  });
});

// One call returns everything the header needs — never four separate calls
// for name, role, notifications, etc.
authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const [user] = await db.select({
    id: users.id, name: users.name, phone: users.phone, role: users.role,
  }).from(users).where(eq(users.id, req.user!.id));
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ user });
});
