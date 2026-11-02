# FUADSI Marketplace

Buy &bull; Sell &bull; Connect. A campus marketplace for the Federal University of Agriculture and Development Studies, Iragbiji.

Next.js 14 (App Router) + TypeScript + Tailwind, Firebase Auth (Google), MongoDB Atlas (Mongoose), Cloudinary, Upstash Redis, deployed on Vercel.

> **Read "Honest status" first.** This codebase was written in an environment without network access, so it has **never been installed, built or run against real services**.

## Honest status

| Area | State |
| --- | --- |
| Pure logic (WhatsApp links, search tokens, order state machine, formatting) | Unit-tested: `npm test` (5 tests passed when written) |
| TypeScript | Checked with `tsc`, but without `node_modules`, so only syntax and name errors were verifiable. Run `npm run typecheck` after installing and fix anything it reports |
| `npm install`, `next build`, runtime behaviour, Firebase/Mongo/Cloudinary/Upstash integration | **Not run.** Expect to fix small issues on first boot |
| Responsive layouts at 320 to 1440px | Written with mobile-first Tailwind, **not visually tested in a browser** |
| Socket.IO | **Not used.** See "Realtime" below |

## Realtime messaging: what changed from the brief

Vercel Functions cannot host a WebSocket server or a long-running Socket.IO process, so Socket.IO cannot work on Vercel by itself. Instead:

- **Transport:** an authenticated streaming HTTP response (`/api/realtime/stream`, Server-Sent Events) with automatic reconnect, replay from the last event id, and an HTTP polling fallback (`/api/realtime/poll`).
- **Cross-instance coordination and presence:** Upstash Redis (event inbox per user, online presence keys, rate limits).
- **Durable state:** all conversations and messages live in MongoDB.
- **Features:** one-to-one chat, conversation list, typing indicator, online / last seen, sent / delivered / read ticks, unread counts, image sharing, product attachments and previews, notifications.
- **Cost note:** an open stream polls Redis about every 2.5 s (1 command per tick), and pauses while the tab is hidden. On Upstash's free tier this supports light usage; move to a paid plan, or to a dedicated realtime service, as traffic grows.

If you later want true WebSockets, run a small Socket.IO server on your existing VPS, authenticate with the Firebase ID token, and keep MongoDB as the source of truth. The REST message endpoints would remain unchanged.

## Features

- Home page following the supplied reference (header, hero, why-choose panel, categories, Hot Deals, Recently Added, Recommended, Join banner, Top Sellers). Product areas show **real database records only** and attractive empty states.
- Google sign-in **and email + password** (with email verification and password reset), onboarding (username, FUADSI affiliation self-declared), profile editing and photo upload. Admin-only verified badge.
- Buyers: browse, search (prefix search), filter by category / price / condition, sort, favourites, cart, order requests, order history, cancel, WhatsApp and in-app chat, reviews after completion.
- Sellers: free storefront at `/store/<username>`, dashboard (overview, products, orders, store settings), multi-image upload through signed Cloudinary uploads, stock and price edits, mark unavailable.
- Moderation: every new listing is `PENDING_APPROVAL`; edits to title / photos / description / category / condition send it back for review; admins cannot approve their own listing.
- Orders: no payment gateway. Pending, Accepted, Rejected, Ready for pickup, Out for delivery, Completed, Cancelled, enforced server-side. Stock is reserved on acceptance and released on cancellation.
- Admin: overview, product review (approve / reject with reason / suspend / remove), users (search, suspend, verify, admin roles), orders, reports, categories, audit log.

## Environment variables

Copy `.env.example` to `.env.local` and fill every value. `npm run check-env` lists anything missing.

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase console, Project settings, Your apps (Web) |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Firebase console, Project settings, Service accounts, Generate new private key. Keep the key in double quotes with `\n` sequences |
| `MONGODB_URI` | MongoDB Atlas, Connect, Drivers |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash console, your Redis database, REST API |
| `ADMIN_EMAILS` | Comma-separated emails promoted to admin on first sign-in (email must be verified by Google) |
| `NEXT_PUBLIC_APP_URL` | Your production URL |

Secrets are only read in server code (`lib/env.ts`). Only the Firebase **web** config and the Cloudinary cloud name are public.

## One-time service setup

1. **Firebase:** create a project, Authentication, Sign-in method, enable **Google** and **Email/Password** (leave "Email link" off). Under Settings, Authorized domains, add your Vercel domain(s) (and `localhost`).
2. **MongoDB Atlas:** create a cluster and database user. Under Network Access allow `0.0.0.0/0` (Vercel uses dynamic IPs) and rely on the strong user password.
3. **Cloudinary:** nothing else needed; uploads are signed per request and restricted to `fuadsi/<kind>/<firebase uid>/`.
4. **Upstash:** create a Redis database (pick the region closest to your Vercel region).

## Troubleshooting sign-in

Enable **Google** and **Email/Password** in Firebase Authentication, and add your site's domain (e.g. `fuadsi-marketplace.vercel.app`) under Authentication, Settings, Authorized domains. After editing any `NEXT_PUBLIC_*` variable in Vercel you must **Redeploy** (they are baked in at build time). The server also accepts Vercel's Upstash names (`KV_REST_API_URL`, `KV_REST_API_TOKEN`), tolerates quoted values, and no longer blocks login when Redis or Cloudinary are missing.

If you sign in but stay on the login page, open **`/api/health`**. It lists missing variables (names only) and tests MongoDB, Redis and Firebase Admin. Typical causes: Atlas Network Access not allowing your IP (use `0.0.0.0/0` on Vercel), a wrong `MONGODB_URI` password, a mangled `FIREBASE_PRIVATE_KEY` (keep it in double quotes with `\n`), or mismatched Firebase project IDs. The login page also shows the server's error message.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values
npm run check-env
npm run typecheck
npm test
npm run dev
```

Sign in with an email listed in `ADMIN_EMAILS` to get the admin dashboard at `/admin`. Default categories are created automatically on first request.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. Vercel, Add New Project, import the repo (framework: Next.js, default build settings).
3. Add every variable from `.env.example` to Project Settings, Environment Variables (Production and Preview).
4. Deploy. `vercel.json` sets a 60 s max duration for the stream route; the client reconnects automatically every ~50 s.
5. Add the final domain to Firebase Authorized domains.

## Verify after deploying (checklist)

- [ ] Google sign-in works on desktop and on a phone; onboarding saves.
- [ ] Open a store, upload photos (progress bar appears), submit a product, see it in `/admin?tab=products`.
- [ ] Approve it as admin from **another** admin account (self-approval is blocked); it appears on the home page.
- [ ] Chat Seller from a second account: messages arrive without refresh, ticks update, typing shows.
- [ ] Order, accept, complete, review; notifications appear in the bell.
- [ ] Layout at 320, 375, 390, 430, tablet and desktop widths.

## Project layout

```
app/            routes (pages) and app/api/* (server endpoints)
components/     UI (layout, home, messages, admin, ui primitives, providers)
lib/            server helpers (auth, db, kv, cloudinary, validators) and shared pure logic
models/         Mongoose models with indexes
public/images/  supplied artwork: branding, hero, mascot, illustrations, original (untouched)
tests/          unit tests for pure logic
```

## Design assets

All artwork comes from the supplied files. Originals are kept untouched in `public/images/original/`. The logo icon was cropped from the logo sheet; the cart and chat illustrations had their white backgrounds removed; the hero uses the mall image. The student mascot only existed inside the UI screenshot, so it was cropped and upscaled from there (it will look soft on high-density screens). Replace `public/images/mascot/student-banner.webp` with the original file if you have it.
