-- TypePilot Supabase setup. Run this in Supabase Dashboard > SQL Editor.
-- Enable Anonymous sign-ins in Authentication > Sign In / Providers before using the app.
create table if not exists public.leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  wpm integer not null check (wpm between 1 and 300),
  accuracy numeric(5,2) not null check (accuracy between 90 and 100),
  duration integer not null check (duration between 15 and 600),
  at timestamptz not null default now()
);
create index if not exists leaderboard_wpm_idx on public.leaderboard (wpm desc, accuracy desc, at asc);
alter table public.leaderboard enable row level security;
drop policy if exists "Leaderboard is publicly readable" on public.leaderboard;
create policy "Leaderboard is publicly readable" on public.leaderboard for select to anon, authenticated using (true);
drop policy if exists "Users insert their own score" on public.leaderboard;
create policy "Users insert their own score" on public.leaderboard for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their own score" on public.leaderboard;
create policy "Users update their own score" on public.leaderboard for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select on public.leaderboard to anon, authenticated;
grant insert, update on public.leaderboard to authenticated;
