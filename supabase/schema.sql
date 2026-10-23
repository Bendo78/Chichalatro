-- Chichalatro: clean database for the game.
-- Run once in a fresh (or emptied) Supabase project: SQL Editor -> New query -> paste -> Run.
-- Creates: the card series, the cards, the player saves, and the public "cards" storage bucket.

-- ---------- card series ----------
create table if not exists public.series (
  id          text primary key,
  code        text not null default '',
  name        text not null,
  color1      text not null default '#ff2e88',
  color2      text not null default '#ffe600',
  back_image  text            -- file name in the "cards" bucket (card back of the series)
);

-- ---------- cards (the super cards of the game) ----------
create table if not exists public.cards (
  id           text primary key,
  series_id    text references public.series(id) on delete set null,
  name         text not null,
  rarity       text not null default 'C' check (rarity in ('C','U','H','R','X','E','P','N','I','L','M','S','K')),
  type         text not null default 'feu' check (type in ('feu','eau','nature','foudre','psy','ombre')),
  hp           int  not null default 0,
  attack_name  text not null default '',
  attack       int  not null default 0,
  description  text not null default '',
  image        text,          -- file name in the "cards" bucket, or a full URL
  image2       text,
  frame_x      real not null default 50,
  frame_y      real not null default 50,
  frame_zoom   real not null default 1,
  card_limit   int  not null default 0,   -- 1 = unique card
  name2        text not null default '',
  duo          boolean not null default false,
  sort         int  not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists cards_series_idx on public.cards(series_id);

-- ---------- player saves (login with a pseudo) ----------
create table if not exists public.chichalatro_players (
  pseudo     text primary key check (pseudo ~ '^[a-z0-9_-]{3,20}$'),
  data       jsonb not null default '{}'::jsonb check (pg_column_size(data) < 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- security ----------
alter table public.series enable row level security;
alter table public.cards enable row level security;
alter table public.chichalatro_players enable row level security;

drop policy if exists "series read" on public.series;
drop policy if exists "cards read" on public.cards;
create policy "series read" on public.series for select to anon, authenticated using (true);
create policy "cards read" on public.cards for select to anon, authenticated using (true);
-- Cards and series can only be edited from the Supabase dashboard (no write policy for the game).

drop policy if exists "chichalatro read" on public.chichalatro_players;
drop policy if exists "chichalatro create" on public.chichalatro_players;
drop policy if exists "chichalatro update" on public.chichalatro_players;
create policy "chichalatro read" on public.chichalatro_players for select to anon, authenticated using (true);
create policy "chichalatro create" on public.chichalatro_players for insert to anon, authenticated with check (true);
create policy "chichalatro update" on public.chichalatro_players for update to anon, authenticated using (true) with check (true);

-- ---------- storage: public bucket for card pictures and videos ----------
insert into storage.buckets (id, name, public)
values ('cards', 'cards', true)
on conflict (id) do update set public = true;
