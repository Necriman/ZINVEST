-- ============================================================
-- Zinvest Platform — Supabase Schema
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ─── VISITS ──────────────────────────────────────────────────
create table if not exists public.visits (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  user_id     uuid references public.users(id) on delete set null,
  page        text not null,
  referrer    text not null default 'direct',
  user_agent  text not null default '',
  created_at  timestamptz not null default now()
);

-- ─── PAGE VIEWS ──────────────────────────────────────────────
create table if not exists public.page_views (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  user_id     uuid references public.users(id) on delete set null,
  page        text not null,
  created_at  timestamptz not null default now()
);

-- ─── SIGNUPS ─────────────────────────────────────────────────
create table if not exists public.signups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────
create index if not exists visits_created_at_idx    on public.visits(created_at desc);
create index if not exists visits_session_id_idx    on public.visits(session_id);
create index if not exists page_views_created_at_idx on public.page_views(created_at desc);
create index if not exists signups_created_at_idx   on public.signups(created_at desc);
create index if not exists users_email_idx          on public.users(email);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
-- Enable RLS on all tables
alter table public.users     enable row level security;
alter table public.visits    enable row level security;
alter table public.page_views enable row level security;
alter table public.signups   enable row level security;

-- Allow anon key to INSERT into all tables (needed for client-side tracking)
create policy "Allow anon insert users"      on public.users      for insert with check (true);
create policy "Allow anon insert visits"     on public.visits     for insert with check (true);
create policy "Allow anon insert page_views" on public.page_views for insert with check (true);
create policy "Allow anon insert signups"    on public.signups    for insert with check (true);

-- Allow anon key to SELECT from all tables (needed for auth check + admin)
create policy "Allow anon select users"      on public.users      for select using (true);
create policy "Allow anon select visits"     on public.visits     for select using (true);
create policy "Allow anon select page_views" on public.page_views for select using (true);
create policy "Allow anon select signups"    on public.signups    for select using (true);

-- ─── DONE ────────────────────────────────────────────────────
-- After running this, copy your Project URL and anon key from
-- Settings > API into your .env.local file:
--
--   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
--   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
