-- Run after the existing supabase-schema.sql in Supabase Dashboard > SQL Editor.
-- Usernames are unique case-insensitively, and the database—not the browser—enforces the change limit.
create table if not exists public.username_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_id integer not null default 0 check (avatar_id between 0 and 47),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint username_profiles_username_unique unique (username)
);
create table if not exists public.username_change_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  changed_at timestamptz not null default now()
);
create index if not exists username_change_events_user_date_idx on public.username_change_events(user_id, changed_at desc);
alter table public.username_profiles enable row level security;
alter table public.username_change_events enable row level security;
drop policy if exists "Profiles are publicly readable" on public.username_profiles;
create policy "Profiles are publicly readable" on public.username_profiles for select to anon, authenticated using (true);
grant select on public.username_profiles to anon, authenticated;
revoke insert, update, delete on public.username_profiles from anon, authenticated;
revoke all on public.username_change_events from anon, authenticated;

alter table public.leaderboard add column if not exists avatar_id integer not null default 0 check (avatar_id between 0 and 47);

create or replace function public.save_username_profile(p_username text, p_avatar_id integer)
returns jsonb language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare uid uuid := auth.uid(); clean_name text := lower(trim(p_username)); old_row public.username_profiles%rowtype; changes integer;
begin
  if uid is null then raise exception 'Sign in is required'; end if;
  if clean_name !~ '^[a-z0-9_]{3,20}$' then raise exception 'Username must be 3–20 characters using letters, numbers, or underscores'; end if;
  if p_avatar_id is null or p_avatar_id < 0 or p_avatar_id > 47 then raise exception 'Choose a valid avatar'; end if;
  select * into old_row from public.username_profiles where user_id = uid for update;
  if not found then
    insert into public.username_profiles(user_id, username, avatar_id) values(uid, clean_name, p_avatar_id);
    return jsonb_build_object('changes_remaining', 2, 'next_change_at', null);
  end if;
  if old_row.username <> clean_name then
    select count(*) into changes from public.username_change_events where user_id = uid and changed_at >= date_trunc('month', now());
    if changes >= 2 then raise exception 'You have used both username changes this month'; end if;
    insert into public.username_change_events(user_id) values(uid);
  end if;
  update public.username_profiles set username=clean_name, avatar_id=p_avatar_id, updated_at=now() where user_id=uid;
  select count(*) into changes from public.username_change_events where user_id=uid and changed_at >= date_trunc('month', now());
  return jsonb_build_object('changes_remaining', greatest(0,2-changes), 'next_change_at', date_trunc('month', now()) + interval '1 month');
end; $$;
revoke all on function public.save_username_profile(text, integer) from public;
grant execute on function public.save_username_profile(text, integer) to authenticated;

-- Keep leaderboard display name/avatar in sync with the saved profile; the app still submits scores for auth.uid().
create or replace function public.sync_leaderboard_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 update public.leaderboard set name=new.username, avatar_id=new.avatar_id where user_id=new.user_id;
 return new;
end; $$;
drop trigger if exists sync_leaderboard_profile_trigger on public.username_profiles;
create trigger sync_leaderboard_profile_trigger after update of username, avatar_id on public.username_profiles for each row execute function public.sync_leaderboard_profile();
