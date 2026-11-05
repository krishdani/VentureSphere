# VentureSphere

VentureSphere connects startups with VCs. Startups list their company and pitch, and VCs browse,
shortlist, select and fund them. Both sides see every status change as it happens.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma and PostgreSQL.
Auth is email + password (bcrypt) with a signed, httpOnly JWT session cookie. No third-party auth
service is used.

## Features

**Startups**
- Sign up as a startup, then create and edit the company profile: name, one-liner, sector, stage
  (Idea / Pre-seed / Seed / Series A+), location, website, team size, amount raising and traction.
- Pitch: written pitch, a PDF pitch deck (PDF only, ≤10MB, checked by MIME type and `%PDF-` magic
  bytes) and an optional video URL.
- Dashboard listing every VC interaction: firm, status, offered amount, note and date.
- In-app notifications with an unread badge whenever a VC changes a deal's status.

**VCs**
- Firm profile: firm name, thesis, cheque size range, preferred sectors and stages.
- Discover: search plus filters for sector, stage and raise range (min/max).
- Startup detail page with the pitch, an inline deck viewer and the video link.
- Deal actions: **Shortlist → Select** (with an optional offered amount and a note) **→ Funded**, or
  **Pass**. A passed startup can be re-shortlisted. Invalid jumps return `409`.
- Pipeline board with deals grouped by status.

**Platform**
- Landing page for both sides with a hero, how-it-works steps, featured startups and CTAs.
- Responsive layout, automatic dark mode (follows the OS setting), loading skeletons, empty states
  and per-field validation messages.

**Access control** (enforced on the server in `lib/access.ts` and `lib/services.ts`, and used by
every route handler and server action)
- Startups can only edit their own company. Another startup or a VC gets `403`.
- Only VCs can act on deals or browse startups. Startups get `403`.
- Decks are served only through `/api/startups/:id/deck`, to logged-in VCs and the owning startup.
  They are stored under random 128-bit names and are never linked publicly.
- `middleware.ts` redirects users without a session, or with the wrong role, away from `/startup/*`,
  `/vc/*` and `/notifications`. Pages re-check against the database.
- The role is always re-read from the database. The cookie alone is never trusted.

## Local setup

Requirements: Node.js 20+ and npm. You don't need to install Postgres, because `embedded-postgres`
downloads and runs one for you.

```bash
npm ci
cp .env.example .env          # then set AUTH_SECRET to a random 32+ char string
npm run db:local              # terminal 1: starts Postgres on localhost:5433 (data in ./.pgdata)
npm run db:setup              # terminal 2: applies migrations + seeds demo data
npm run dev                   # http://localhost:3000
```

To use your own Postgres instead, point `DATABASE_URL` and `DIRECT_URL` at it and skip `db:local`.

### Demo accounts (development seed)

All demo accounts use the password `demo12345`.

| Role | Email | Notes |
|---|---|---|
| VC | `partner@horizonvc.demo` | Horizon Ventures. Has shortlisted GreenLoop and selected MediBridge. |
| Startup | `founder@nimbusai.demo` | Nimbus AI (AI/ML, Seed). Has a deck and a video. |
| Startup | `founder@greenloop.demo` | GreenLoop (Climate, Pre-seed). Shortlisted. |
| Startup | `founder@medibridge.demo` | MediBridge (Healthtech, Series A+). Selected with a $2M offer. |
| Startup | `founder@ledgerly.demo` | Ledgerly (Fintech, Idea). Profile not finished yet. |

Re-running `npm run db:seed` resets these accounts. See [DEPLOY.md](DEPLOY.md) for the safer
production seed, where the startups are listing-only and the VC password is yours to change.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) at http://localhost:3000 |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (auth helpers, access control, deal transitions, deck validation and storage) |
| `npm run db:local` | Start the embedded local Postgres (leave it running) |
| `npm run db:setup` | `prisma migrate deploy` + seed |
| `npm run db:seed` | Seed only (`SEED_MODE=production` for the production seed) |
| `npm run db:reset` | Drop everything, re-migrate and re-seed |
| `npm run user:password -- <email> <new>` | Set a user's password |
| `npm run vercel-build` | Used automatically by Vercel: `prisma migrate deploy` + build |

## Environment variables

See [`.env.example`](.env.example). These are required: `DATABASE_URL`, `DIRECT_URL` and
`AUTH_SECRET`. These are optional: `BLOB_READ_WRITE_TOKEN` and `BLOB_ACCESS` (pitch decks in
Vercel Blob instead of `./uploads`), `COOKIE_SECURE`, `UPLOAD_DIR` and `DEMO_VC_PASSWORD`.

## API

The UI uses server actions. The same operations are also available as JSON (or multipart) route
handlers, with the same checks, which is handy for scripts and testing:

| Method & path | Who | |
|---|---|---|
| `POST /api/auth/signup` · `/login` · `/logout` | anyone | `{name,email,password,role}` / `{email,password}` |
| `GET /api/me` | logged in | Current user plus unread notification count |
| `GET /api/startups?q=&sector=&stage=&minRaise=&maxRaise=` | VC | Browse and filter |
| `POST /api/startups` | startup | Create or update your own profile (multipart may include `deck`) |
| `GET /api/startups/:id` · `PUT /api/startups/:id` | VC or owner · owner | |
| `GET /api/startups/:id/deck` · `POST /api/startups/:id/deck` | VC or owner · owner | |
| `GET /api/deals` · `POST /api/deals` | both · VC | `{startupId, action: SHORTLIST\|SELECT\|FUND\|PASS, offeredAmount?, note?}` |
| `GET /api/notifications` · `POST /api/notifications` | logged in | List · mark all read |

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for Vercel with Neon Postgres and Vercel Blob.
