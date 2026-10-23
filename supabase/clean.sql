-- ATTENTION: deletes everything from the old CHICHA TCG in this project
-- (all tables, views and functions of the "public" schema, and all user accounts).
-- It cannot be undone. Make the backup first (supabase/backup, see NETTOYAGE.md).
-- The tables of the game (series, cards, chichalatro_players) are kept if they already exist.
-- The pictures in the "cards" storage bucket are NOT touched (the game reuses them).

do $$
declare r record;
begin
  -- views
  for r in select table_name from information_schema.views where table_schema = 'public' loop
    execute format('drop view if exists public.%I cascade', r.table_name);
  end loop;
  -- tables
  for r in select tablename from pg_tables
           where schemaname = 'public' and tablename not in ('series', 'cards', 'chichalatro_players') loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;
  -- functions written for the old app (functions that belong to extensions are skipped)
  for r in select p.oid::regprocedure as f
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
           where n.nspname = 'public' and d.objid is null loop
    execute format('drop function if exists %s cascade', r.f);
  end loop;
end $$;

-- user accounts of the old TCG (the game does not use accounts, only pseudos)
delete from auth.users;
