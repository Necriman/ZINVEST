# MUNHub — Uzbekistan MUN Tracker & Academy

A premium dark-mode dashboard for the Model UN community of Uzbekistan.
Two pillars: a **live conference tracker** (real-time registration statuses via
Supabase) and an **Academy** (guides & rules of procedure by experience level).

## Stack

React 18 (Vite) · Tailwind CSS · Framer Motion · Lucide React · Supabase (Postgres + Auth + Realtime)

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 — runs on mock data, zero setup
```

## Going live with Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Paste `supabase/schema.sql` into the SQL Editor and run it
   (tables + RLS + realtime + the full 2026 season seed).
3. `cp .env.example .env` and fill in the URL + anon key.
4. Restart `npm run dev`. The board now reads live rows, and any status change
   an organizer makes appears on every open dashboard instantly — no refresh.

## Project structure

```
src/
  data/conferences.js      # mock season data + status/gradient config
  hooks/useConferences.js  # mock-first feed, swaps to Supabase + realtime
  lib/supabase.js          # client (null-safe when .env is absent)
  lib/utils.js             # date range / countdown helpers
  components/
    Navbar.jsx             # fixed glass top bar
    Hero.jsx               # headline, CTAs, animated live stats
    FilterBar.jsx          # sticky pills + search ("/" to focus)
    ConferenceCard.jsx     # dated conference card (register / notify)
    ConferenceGrid.jsx     # animated responsive grid
    PlannedSection.jsx     # date-TBA watchlist
    AcademySection.jsx     # knowledge hub teaser
    EmptyState.jsx / Footer.jsx
supabase/schema.sql        # full DB schema — see comments inside
```

## Accessibility & polish baked in

- `prefers-reduced-motion` respected globally (`MotionConfig reducedMotion="user"`)
- Keyboard: visible focus rings, `/` focuses search, aria labels on icon buttons
- All touch targets ≥ 44 px; no emoji-as-icons; tabular numerals for countdowns
