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

-- ─── UNIT TESTS ─────────────────────────────────────────────
-- Stores each unit test attempt for Global Top ranking.
create table if not exists public.unit_test_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete cascade,
  unit_key      text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz not null,
  duration_ms  integer not null default 0,
  quality_score integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ─── PREMIUM REWARDS ─────────────────────────────────────────
-- Premium is granted to top-3 winners after unit tests.
create table if not exists public.premium_rewards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete cascade,
  unit_key      text not null,
  rank          integer not null,
  granted_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  attempt_id    uuid references public.unit_test_attempts(id) on delete set null,
  quality_score integer not null default 0,
  duration_ms  integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (user_id, unit_key, rank)
);

-- ─── AI RISK SCORING ANALYSES ─────────────────────────────────
-- Stores AI inputs + scoring results for risk decisions.
create table if not exists public.analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete set null,
  type        text not null,
  input_data  jsonb not null,
  result      jsonb not null,
  created_at  timestamptz not null default now()
);

-- ─── AI CHAT HISTORY (TUTOR) ───────────────────────────────
-- Stores TurboAI tutor conversations and their messages.
create table if not exists public.ai_chat_conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete set null,
  mode          text not null default 'finance',
  course_key    text null,
  lesson_id     integer null,
  language      text null,
  title         text null,
  last_message  text null,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create table if not exists public.ai_chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_chat_conversations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  role            text not null,
  content         text not null,
  created_at      timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────
create index if not exists visits_created_at_idx    on public.visits(created_at desc);
create index if not exists visits_session_id_idx    on public.visits(session_id);
create index if not exists page_views_created_at_idx on public.page_views(created_at desc);
create index if not exists signups_created_at_idx   on public.signups(created_at desc);
create index if not exists users_email_idx          on public.users(email);

create index if not exists unit_test_attempts_unit_key_idx on public.unit_test_attempts(unit_key);
create index if not exists unit_test_attempts_user_idx on public.unit_test_attempts(user_id);
create index if not exists premium_rewards_user_expires_idx on public.premium_rewards(user_id, expires_at desc);

create index if not exists analyses_user_id_idx on public.analyses(user_id);
create index if not exists analyses_created_at_idx on public.analyses(created_at desc);

create index if not exists ai_chat_conversations_user_id_idx on public.ai_chat_conversations(user_id);
create index if not exists ai_chat_conversations_updated_at_idx on public.ai_chat_conversations(updated_at desc);
create index if not exists ai_chat_messages_conversation_id_idx on public.ai_chat_messages(conversation_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
-- Enable RLS on all tables
alter table public.users     enable row level security;
alter table public.visits    enable row level security;
alter table public.page_views enable row level security;
alter table public.signups   enable row level security;
alter table public.unit_test_attempts enable row level security;
alter table public.premium_rewards    enable row level security;
alter table public.analyses          enable row level security;

alter table public.ai_chat_conversations enable row level security;
alter table public.ai_chat_messages enable row level security;

-- Allow anon key to INSERT into all tables (needed for client-side tracking)
DO $$
BEGIN
  CREATE POLICY "Allow anon insert users" ON public.users FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon insert visits" ON public.visits FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon insert page_views" ON public.page_views FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon insert signups" ON public.signups FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon insert unit_test_attempts" ON public.unit_test_attempts FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon insert premium_rewards" ON public.premium_rewards FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon update premium_rewards" ON public.premium_rewards
  FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon insert analyses" ON public.analyses FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon insert ai_chat_conversations" ON public.ai_chat_conversations FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon update ai_chat_conversations" ON public.ai_chat_conversations
  FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon update ai_chat_messages" ON public.ai_chat_messages
  FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon insert ai_chat_messages" ON public.ai_chat_messages FOR insert WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Allow anon key to SELECT from all tables (needed for auth check + admin)
DO $$
BEGIN
  CREATE POLICY "Allow anon select users" ON public.users FOR select USING (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon select visits" ON public.visits FOR select USING (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon select page_views" ON public.page_views FOR select USING (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon select signups" ON public.signups FOR select USING (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon select unit_test_attempts" ON public.unit_test_attempts FOR select USING (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon select premium_rewards" ON public.premium_rewards FOR select USING (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow anon select analyses" ON public.analyses FOR select USING (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow user select ai_chat_conversations" ON public.ai_chat_conversations FOR select USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow user select ai_chat_messages" ON public.ai_chat_messages FOR select USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ─── DONE ────────────────────────────────────────────────────
-- After running this, copy your Project URL and anon key from
-- Settings > API into your .env.local file:
--
--   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
--   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
