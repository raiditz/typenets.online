-- Run AFTER supabase-schema.sql and supabase-profile-migration.sql (safe to re-run).
-- Lets the app show "N of 2 username changes left this month" without spending a change.
-- Rules enforced by save_username_profile (unchanged):
--   * creating your first username is free and does NOT count as a change
--   * changing to a different username counts as 1 change; 2 are allowed per calendar month (UTC)
--   * changing only the avatar is always free
create or replace function public.get_username_status()
returns jsonb language plpgsql stable security definer set search_path = public, auth, pg_temp as $$
declare uid uuid := auth.uid(); used integer := 0; has_prof boolean;
begin
  if uid is null then raise exception 'Sign in is required'; end if;
  select exists(select 1 from public.username_profiles where user_id = uid) into has_prof;
  select count(*) into used from public.username_change_events
    where user_id = uid and changed_at >= date_trunc('month', now());
  return jsonb_build_object(
    'has_profile', has_prof,
    'changes_used', used,
    'changes_remaining', greatest(0, 2 - used),
    'next_change_at', date_trunc('month', now()) + interval '1 month'
  );
end; $$;
revoke all on function public.get_username_status() from public;
grant execute on function public.get_username_status() to authenticated;
