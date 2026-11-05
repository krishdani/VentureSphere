# Deploying VentureSphere to Vercel

Production setup: **Vercel** hosts the app, **Neon Postgres** (from the Vercel Marketplace) holds
the database, and **Vercel Blob** stores the pitch decks. Vercel's filesystem is read-only and
ephemeral, so neither SQLite nor local uploads would persist there.

## 1. Import the repo

1. Push the repo to GitHub (e.g. `krishdani/VentureSphere`).
2. In Vercel, go to **Add New… → Project**, import the repo and keep the defaults (Framework
   preset: Next.js). Don't deploy yet. Close the first deploy if it starts, because it will fail
   until the database exists.

### Build command

`package.json` has a `vercel-build` script, which Vercel runs instead of `build`:

```
prisma migrate deploy && npm run build      # npm run build = prisma generate && next build
```

So **every deployment applies any pending Prisma migrations** (committed in `prisma/migrations/`)
before building. `postinstall` also runs `prisma generate`. Leave the Build Command in Vercel at
its default, or set it to `npm run vercel-build` explicitly.

## 2. Add Neon Postgres

1. Go to **Project → Storage → Create Database → Neon (Serverless Postgres)**, or open
   **Marketplace → Neon → Install**, and connect it to this project for all environments.
2. Neon injects env vars into the project. VentureSphere needs these two names:
   - `DATABASE_URL`: the **pooled** connection string (host contains `-pooler`). Neon's
     integration sets this name already.
   - `DIRECT_URL`: the **direct, unpooled** connection string that `prisma migrate` uses. The
     integration exposes it as `DATABASE_URL_UNPOOLED`. Go to **Settings → Environment Variables**,
     add `DIRECT_URL`, and paste the same value as `DATABASE_URL_UNPOOLED`.

   If your integration only created `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING`, use those
   values for `DATABASE_URL` and `DIRECT_URL` respectively.

## 3. Add Vercel Blob

1. Go to **Project → Storage → Create → Blob**, choose **Private** access and connect it to the
   project. This adds `BLOB_READ_WRITE_TOKEN`.
2. Decks are then stored in Blob under `decks/<128 random bits>.pdf` and are only ever streamed
   through the auth-checked route `/api/startups/:id/deck`.
   - Browsers upload decks **directly to Blob**, using a short-lived token from
     `/api/uploads/deck`, because Vercel functions accept at most 4.5MB per request. The token is
     issued only to logged-in startups, and only for a PDF of ≤10MB at a random path with no
     overwrites. The server then re-downloads the file and checks the size, type and `%PDF-` magic
     bytes before attaching it, and deletes it if the check fails.
   - If your Blob store is **public** rather than private, also set `BLOB_ACCESS=public`. The paths
     stay unguessable and the app never exposes the blob URLs, but use Private if you can.

Without `BLOB_READ_WRITE_TOKEN` the app writes decks to `./uploads`, which only works for local dev.

## 4. Environment variables

Set these under **Project → Settings → Environment Variables** (Production, and Preview if you use
it):

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled URL (set by the integration) |
| `DIRECT_URL` | Neon direct/unpooled URL (copy of `DATABASE_URL_UNPOOLED`) |
| `AUTH_SECRET` | A random 32+ char string: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `BLOB_READ_WRITE_TOKEN` | Set by the Blob integration |
| `BLOB_ACCESS` | Only if the Blob store is public: `public` |

Notes:
- The app refuses to run in production without an `AUTH_SECRET` of 32+ chars. Changing the secret
  logs everyone out.
- Do **not** set `COOKIE_SECURE=false` in production. Cookies are `Secure`, `HttpOnly` and
  `SameSite=Lax` by default.

Then click **Deploy** (or **Redeploy**). The first build creates all tables.

## 5. Seed once (optional demo content)

Seeding is a **manual, one-time** step. It never runs during builds. Run it from your machine
against the production database:

```bash
vercel env pull .env.production.local     # pulls DATABASE_URL, DIRECT_URL, BLOB_READ_WRITE_TOKEN…
set -a; source .env.production.local; set +a
SEED_MODE=production DEMO_VC_PASSWORD='choose-a-strong-password' npm run db:seed
```

What the **production** seed (`SEED_MODE=production`) does:
- It creates **4 demo startup listings** (Nimbus AI, GreenLoop, MediBridge, Ledgerly), marks them
  *featured* on the landing page, and uploads their sample decks to Blob. Their owner accounts get
  **random passwords**, so nobody can log in as them.
- It creates **one demo VC login**: `partner@horizonvc.demo` (Horizon Ventures). Its password is
  `DEMO_VC_PASSWORD`, or **`demo12345` if you don't set one**. That default is published in this
  repo, so **change it right away**:
  ```bash
  npm run user:password -- partner@horizonvc.demo 'a-new-strong-password'
  ```
- It creates **no** fake deals or notifications.
- It is idempotent. Re-running it never resets passwords, decks or any real user data.

Don't run the plain development seed (`npm run db:seed` without `SEED_MODE=production`) against
production. It resets the demo accounts to the public password `demo12345` and adds sample deals.

To stop featuring the demo startups later, set `featured = false` on them, e.g. in Neon's SQL
editor: `UPDATE "Startup" SET featured = false;`.

## 6. Later changes to the schema

1. Locally: run `npm run db:local`, then `npx prisma migrate dev --name <change>`.
2. Commit the new folder under `prisma/migrations/`.
3. Push. The Vercel build runs `prisma migrate deploy` before building.

## Checklist

- [ ] Repo imported into Vercel
- [ ] Neon connected; `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) set
- [ ] Blob store (Private) connected; `BLOB_READ_WRITE_TOKEN` present
- [ ] `AUTH_SECRET` set
- [ ] Deployed and the build log shows `prisma migrate deploy` succeeding
- [ ] (Optional) Ran the production seed once, then changed the demo VC password
