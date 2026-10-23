-- Chichalatro: one row per player, found by pseudo.
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists public.chichalatro_players (
  pseudo     text primary key check (pseudo ~ '^[a-z0-9_-]{3,20}$'),
  data       jsonb not null default '{}'::jsonb check (pg_column_size(data) < 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chichalatro_players enable row level security;

-- Anyone with the game can read, create and update a save (login is just a pseudo, no password).
drop policy if exists "chichalatro read" on public.chichalatro_players;
drop policy if exists "chichalatro create" on public.chichalatro_players;
drop policy if exists "chichalatro update" on public.chichalatro_players;
create policy "chichalatro read" on public.chichalatro_players for select to anon, authenticated using (true);
create policy "chichalatro create" on public.chichalatro_players for insert to anon, authenticated with check (true);
create policy "chichalatro update" on public.chichalatro_players for update to anon, authenticated using (true) with check (true);
-- No delete policy: saves cannot be deleted from the game.
