# Kudan Memorial

A free, installable community registry for the deceased and families of Kudan
(Kudan Ward, Kudan Local Government, Kaduna State).

## Stack
- Frontend: Vite + React + TypeScript (installable as a PWA — no Play Store needed)
- Backend: Node.js + Express + Drizzle ORM
- Database: PostgreSQL (your local Postgres in dev, Neon free tier in production)
- File storage: local disk in dev, Cloudflare R2 (or Supabase Storage) free tier in production

## Project layout
```
kudan-memorial/
  server/   -> Express API + Drizzle schema
  client/   -> Vite/React/TS app (PWA)
```

## Run it locally

### 1. Database
Create a database in your local Postgres:
```
createdb kudan_memorial
```

### 2. Server
```
cd server
cp .env.example .env     # edit DATABASE_URL and JWT_SECRET
npm install
npm run db:push          # creates tables from the Drizzle schema
npm run dev              # starts API on http://localhost:4000
```

### 3. Client
```
cd client
cp .env.example .env     # VITE_API_URL=http://localhost:4000
npm install
npm run dev              # starts app on http://localhost:5173
```

Open http://localhost:5173 — add a deceased record, create a family, check the
list sorts newest-first.

## What's built vs. what's left
This scaffold gives you a working skeleton: schema, auth, deceased + families
API and pages, pagination, search, PWA config, and the anti-pattern rules
already applied (indexes, no N+1 queries, pooled connections, no base64
images, paginated lists, debounced search).

Still to build out (flagged with TODO comments in the code): moderation
queue UI, condolence messages, "On this day", QR codes, Hausa translation,
anniversary emails, CSV export, printable cards. These are additive — the
foundation does not need to change to add them.

See DEPLOYMENT.md for how to put this online for free.
