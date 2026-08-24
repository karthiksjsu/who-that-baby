# Who's That Baby? 🍼

A QR-code party game for the baby shower: guests guess which grown-up each
baby photo belongs to, guessing fast for bonus points, with a live
leaderboard and a confetti winner reveal at the end.

- **Admin** (`/admin`) — passcode-gated. Upload baby photos + the correct
  name for each, flip the game draft → live → closed, watch the live
  leaderboard, reveal the winner, and show/print the join QR code.
- **Players** (`/`) — scan the QR code, type a name (no signup), swipe
  through a Tinder-style stack of baby photos picking the correct name from
  a multiple-choice set.

## Stack

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion +
Supabase (Postgres + Storage + Realtime) + Vercel.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com/dashboard).

3. **Run the schema.** In the Supabase dashboard's SQL Editor, paste and run
   `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_storage.sql`
   (in that order).

4. **Fill in `.env.local`** (copy from `.env.example` if you don't have one
   yet) with your project's URL and keys from **Project Settings → API**:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ADMIN_PASSCODE=            # what you type at /admin — change this!
   ADMIN_COOKIE_SECRET=       # generate with: openssl rand -hex 32
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

5. **Run it**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000/admin](http://localhost:3000/admin), log in
   with `ADMIN_PASSCODE`, and add at least 4 baby photos on the dashboard so
   multiple-choice guessing has enough options.

## Running the game at the party

1. On `/admin/dashboard`, upload all the baby photos and flip status to
   **Live** when you're ready to start.
2. Show `/admin/share` on a projector or print it — that's the QR code
   guests scan to join.
3. Watch `/admin/leaderboard` live as guests play.
4. When everyone's done, hit **Reveal Winner** — connected players
   automatically jump to the confetti winner screen.

## Deploying

```bash
npx vercel login
npx vercel link
# add all six env vars above for Production (and Preview) via the Vercel
# dashboard or `vercel env add`
npx vercel --prod
```

After the first prod deploy, update `NEXT_PUBLIC_SITE_URL` to the real
domain and redeploy once so the QR code on `/admin/share` points to the
live URL.
