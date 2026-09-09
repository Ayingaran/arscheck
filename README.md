# ArsCheck

Portfolio-grade art exhibition tour check-in system built with Next.js App Router + TypeScript, Tailwind CSS, Framer Motion, Lucide, a lightweight shadcn-style component layer, Supabase, and `html5-qrcode`.

## What is included

- Unified SPA shell with Admin / Scanner view toggle
- High-end gallery-style visual system with editorial serif + clean UI typography
- Dashboard metrics, live check-in feed, tour capacity manager, and searchable visitor table
- Camera QR scanner with manual ticket fallback
- Success/error states with soundless visual feedback, vibration when supported, and Sonner toasts
- Supabase API routes:
  - `POST /api/check-in`
  - `GET /api/dashboard-stats`
  - `PATCH /api/visitors/:id`
- Supabase Realtime subscription for `visitors`
- SQL schema + seeded exhibition/tour/visitor data
- Demo fallback data when Supabase env vars are not configured

## Setup

1. Use Node.js 20.9+.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

4. Run `supabase/schema.sql` in the Supabase SQL Editor.
5. Start the app:

```bash
npm run dev
```

## Production notes

The included RLS policies are intentionally demo-friendly so the browser can receive Realtime changes. For a real museum deployment, add Supabase Auth and a staff-role policy layer, and restrict visitor reads/writes to authorized operators. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code.

The API currently trusts the server-side service role for mutations; add authentication + role authorization before production use.

## Realtime

The browser subscribes to `public.visitors` using Supabase Realtime Postgres Changes. The SQL adds `visitors` to the `supabase_realtime` publication.

## Scanner

Camera access requires HTTPS (or localhost) in modern browsers. The scanner library is dynamically imported on the client to avoid SSR issues.
