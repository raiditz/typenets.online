-- TypeNets: run this once in Supabase SQL Editor.
-- Deletes the authenticated visitor's username profile and associated leaderboard entry.
-- The username becomes available again after this transaction commits.
create or replace function public.delete_my_username_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  delete from public.leaderboard where user_id = v_uid;
  delete from public.username_profiles where user_id = v_uid;
end;
$$;

revoke all on function public.delete_my_username_profile() from public;
grant execute on function public.delete_my_username_profile() to authenticated;
