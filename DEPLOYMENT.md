# Deploying Kudan Memorial for free

## 1. Database — Neon (free Postgres)
1. Create a project at https://neon.tech (free tier: 0.5GB storage, enough to start).
2. Copy the pooled connection string (it includes `-pooler` in the hostname).
3. Run your schema against it once locally:
   `DATABASE_URL="<neon-url>" npm run db:push` (from /server)

## 2. Backend — Render (free tier)
1. Push this repo to GitHub.
2. New "Web Service" on https://render.com, point it at the `server` folder.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables: `DATABASE_URL` (Neon URL), `JWT_SECRET`, `CORS_ORIGIN`
   (your Cloudflare Pages URL), `NODE_ENV=production`.
6. Free tier note: the service sleeps after 15 minutes idle and takes ~30s to
   wake up on the next request. Mention this to users, or ping it every 10
   minutes with a free uptime monitor (e.g. UptimeRobot) if you want it warm.

## 3. File storage — Cloudflare R2 (free 10GB)
1. Create an R2 bucket, make it public (or use signed URLs).
2. Compress photos client-side before upload (already wired in AddDeceased.tsx)
   so you stay well inside the free tier even with thousands of photos.

## 4. Frontend — Cloudflare Pages (free, unlimited bandwidth)
1. Connect the repo, set the build root to `client`.
2. Build command: `npm run build`, output directory: `dist`.
3. Environment variable: `VITE_API_URL` = your Render backend URL.
4. Cloudflare Pages serves over HTTPS automatically — required for the PWA
   install prompt to appear.

## 5. Region matching
Pick Render's region closest to where your Neon database is (both support
Europe/US regions) — keeps every query fast instead of crossing an ocean.

## 6. Backups
Neon free tier has no automatic backups. Run this weekly from anywhere with
Postgres client tools installed:
```
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```
Keep the dumps somewhere safe (e.g. your own Google Drive).

## 7. Installing on a phone (no Play Store)
Once deployed, open the Cloudflare Pages URL in Chrome on Android (or Safari
on iOS) → menu → "Add to Home Screen" / "Install app". It then opens full-screen
like a native app.
