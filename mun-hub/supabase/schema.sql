-- ============================================================================
-- MUNHub — Supabase / PostgreSQL schema
-- Run in the Supabase SQL Editor (or `supabase db push`). Idempotent-ish:
-- drop-and-recreate is fine on a fresh project; on an existing one, review first.
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ── Enums ───────────────────────────────────────────────────────────────────

create type public.conference_status as enum (
  'registration_open',   -- registration live
  'registration_soon',   -- dates announced, registration not open yet
  'planned',             -- confirmed by organizers, date TBA
  'ongoing',
  'completed',
  'cancelled'
);

create type public.experience_level as enum (
  'rookie', 'intermediate', 'advanced', 'chair', 'organizer'
);

create type public.resource_kind as enum (
  'guide', 'rules_of_procedure', 'template', 'video', 'glossary', 'sample_paper'
);

create type public.participation_status as enum (
  'bookmarked', 'applied', 'accepted', 'waitlisted', 'attended', 'awarded'
);

-- ── user_profiles: 1:1 extension of auth.users ─────────────────────────────

create table public.user_profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  username         text unique not null
                     check (username ~ '^[a-z0-9_]{3,30}$'),
  full_name        text,
  avatar_url       text,
  institution      text,                          -- school / university
  city             text not null default 'Tashkent',
  level            public.experience_level not null default 'rookie',
  telegram_handle  text,
  bio              text check (char_length(bio) <= 500),
  xp               integer not null default 0 check (xp >= 0), -- gamification
  is_organizer     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── conferences: the tracker's core table ──────────────────────────────────

create table public.conferences (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name                  text not null,
  abbreviation          text check (char_length(abbreviation) <= 6),
  description           text,
  status                public.conference_status not null default 'planned',
  starts_on             date,                     -- null while status = 'planned'
  ends_on               date,                     -- null for single-day events
  city                  text not null default 'Tashkent',
  venue                 text,
  registration_url      text,
  registration_deadline timestamptz,
  logo_url              text,                     -- Supabase Storage public URL
  banner_url            text,
  fee_amount            numeric(12, 2) check (fee_amount >= 0),
  fee_currency          char(3) not null default 'UZS',
  delegate_capacity     integer check (delegate_capacity > 0),
  committees            jsonb not null default '[]'::jsonb, -- [{name, topic, level}]
  contact_telegram      text,
  organizer_id          uuid references public.user_profiles (id) on delete set null,
  is_verified           boolean not null default false,     -- vetted by MUNHub team
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint conferences_date_order
    check (ends_on is null or starts_on is null or ends_on >= starts_on),
  -- a conference can't accept registrations without a confirmed date
  constraint conferences_open_requires_date
    check (status <> 'registration_open' or starts_on is not null)
);

create index conferences_status_idx    on public.conferences (status);
create index conferences_starts_on_idx on public.conferences (starts_on) where starts_on is not null;

-- ── guides_and_resources: the Academy ──────────────────────────────────────

create table public.guides_and_resources (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  title         text not null,
  summary       text check (char_length(summary) <= 300),
  kind          public.resource_kind not null default 'guide',
  level         public.experience_level not null default 'rookie', -- target audience
  topic         text,                        -- 'Position papers', 'Public speaking', …
  content_md    text,                        -- markdown body for internal guides
  external_url  text,                        -- …or a link out
  file_url      text,                        -- …or a stored file (Supabase Storage)
  read_minutes  smallint check (read_minutes between 1 and 240),
  language      char(2) not null default 'en' check (language in ('en', 'ru', 'uz')),
  author_id     uuid references public.user_profiles (id) on delete set null,
  view_count    integer not null default 0,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- a resource must have at least one form of content
  constraint resource_has_content
    check (content_md is not null or external_url is not null or file_url is not null)
);

create index guides_level_idx     on public.guides_and_resources (level);
create index guides_kind_idx      on public.guides_and_resources (kind);
create index guides_published_idx on public.guides_and_resources (is_published) where is_published;

-- ── saved_muns: bookmarks + full participation history ─────────────────────

create table public.saved_muns (
  user_id        uuid not null references public.user_profiles (id) on delete cascade,
  conference_id  uuid not null references public.conferences (id) on delete cascade,
  status         public.participation_status not null default 'bookmarked',
  committee      text,                       -- e.g. 'UNSC'
  country        text,                       -- assigned country, e.g. 'France'
  award          text,                       -- 'Best Delegate', 'Honourable Mention', …
  notes          text check (char_length(notes) <= 1000),
  notify_on_open boolean not null default true, -- powers "watch" / deadline radar
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  primary key (user_id, conference_id)       -- one row per user per conference
);

create index saved_muns_conference_idx on public.saved_muns (conference_id);

-- ── Housekeeping triggers ───────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_user_profiles_touch before update on public.user_profiles
  for each row execute function public.touch_updated_at();
create trigger trg_conferences_touch before update on public.conferences
  for each row execute function public.touch_updated_at();
create trigger trg_guides_touch before update on public.guides_and_resources
  for each row execute function public.touch_updated_at();
create trigger trg_saved_muns_touch before update on public.saved_muns
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row on signup (username from email local-part).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    -- sanitize + de-dupe: 'jane.doe@x.com' → 'jane_doe' (+ random suffix on clash)
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '_', 'gi'))
      || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────────────────────────

alter table public.user_profiles        enable row level security;
alter table public.conferences          enable row level security;
alter table public.guides_and_resources enable row level security;
alter table public.saved_muns           enable row level security;

-- Profiles: public directory, self-service edits.
create policy "profiles are viewable by everyone"
  on public.user_profiles for select using (true);
create policy "users update own profile"
  on public.user_profiles for update using (auth.uid() = id);

-- Conferences: world-readable; verified organizers manage their own events.
create policy "conferences are viewable by everyone"
  on public.conferences for select using (true);
create policy "organizers insert own conferences"
  on public.conferences for insert with check (
    auth.uid() = organizer_id
    and exists (select 1 from public.user_profiles p
                where p.id = auth.uid() and p.is_organizer)
  );
create policy "organizers update own conferences"
  on public.conferences for update using (auth.uid() = organizer_id);

-- Guides: published ones are public; authors see and manage their drafts.
create policy "published guides are viewable by everyone"
  on public.guides_and_resources for select
  using (is_published or auth.uid() = author_id);
create policy "authors insert guides"
  on public.guides_and_resources for insert with check (auth.uid() = author_id);
create policy "authors update own guides"
  on public.guides_and_resources for update using (auth.uid() = author_id);

-- Saved MUNs: strictly private to each user.
create policy "users manage own saved muns"
  on public.saved_muns for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Realtime: push conference changes to every open dashboard ──────────────

alter publication supabase_realtime add table public.conferences;

-- ── Seed: the 2026 season ───────────────────────────────────────────────────

insert into public.conferences (slug, name, abbreviation, status, starts_on, ends_on) values
  -- registration open
  ('yq-mun',    'Yashil Qo''llar MUN', 'YQ',   'registration_open', '2026-07-11', null),
  ('gs-mun',    'Global Step MUN',     'GS',   'registration_open', '2026-07-12', null),
  ('sol-mun-2', 'SOL MUN 2',           'SOL',  'registration_open', '2026-07-17', '2026-07-18'),
  ('fs-mun',    'FS MUN',              'FS',   'registration_open', '2026-07-19', null),
  ('pdp-mun',   'PDP MUN',             'PDP',  'registration_open', '2026-07-26', null),
  ('aegis-mun', 'AEGIS MUN',           'AEG',  'registration_open', '2026-08-02', null),
  -- dates announced, registration not open yet
  ('ou-mun',    'OU MUN',              'OU',   'registration_soon', '2026-08-15', '2026-08-16'),
  ('piima-mun', 'PIIMA MUN',           'PIA',  'registration_soon', '2026-08-23', null),
  ('js-mun',    'JS MUN',              'JS',   'registration_soon', '2026-09-06', null),
  ('ois-mun-4', 'OIS MUN 4.0',         'OIS',  'registration_soon', '2026-09-12', '2026-09-13'),
  ('wist-mun',  'WIST MUN',            'WIST', 'registration_soon', '2026-09-19', null),
  -- planned, date TBA
  ('special-mun', 'Special MUN', 'SPL',  'planned', null, null),
  ('aluwed-mun',  'ALUWED MUN',  'ALU',  'planned', null, null),
  ('tiiame-mun',  'TIIAME MUN',  'TIA',  'planned', null, null),
  ('ns-mun',      'NS MUN',      'NS',   'planned', null, null),
  ('tsuos-mun',   'TSUOS MUN',   'TSU',  'planned', null, null),
  ('mdist-mun',   'MDIST MUN',   'MDT',  'planned', null, null),
  ('target-mun',  'Target MUN',  'TGT',  'planned', null, null),
  ('newuu-mun',   'NewUU MUN',   'NUU',  'planned', null, null),
  ('emu-mun',     'EMU MUN',     'EMU',  'planned', null, null),
  ('eis-mun',     'EIS MUN',     'EIS',  'planned', null, null),
  ('ptu-mun',     'PTU MUN',     'PTU',  'planned', null, null),
  ('jdu-mun',     'JDU MUN',     'JDU',  'planned', null, null);
