# VentureSphere

A [Next.js](https://nextjs.org) 15 app (App Router, React 19, TypeScript, Tailwind CSS 4),
bootstrapped with `create-next-app`. It currently renders a single placeholder
page (`app/page.tsx`).

## Requirements

- Node.js 18.18+ (20 LTS or newer recommended)
- npm (the repo ships a `package-lock.json`)

## Setup

```bash
git clone https://github.com/krishdani/VentureSphere.git
cd VentureSphere
npm ci
```

No environment variables are needed yet; `.env.example` is the place to list
them once the app reads any (copy it to `.env.local`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with Turbopack at http://localhost:3000 |
| `npm run build` | Production build (Turbopack) |
| `npm start` | Serve the production build at http://localhost:3000 |
| `npm run lint` | ESLint (`next/core-web-vitals`, `next/typescript`) |

Edit `app/page.tsx` to change the home page; the dev server reloads automatically.

## Deploy

Deploys to [Vercel](https://vercel.com/new) or any Node host with `npm run build && npm start`.
