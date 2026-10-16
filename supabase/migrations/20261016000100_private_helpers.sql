-- Keep the role checks out of the public API (they were callable via /rest/v1/rpc/...).
create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.is_staff() set schema private;
alter function public.is_admin() set schema private;
alter function public.keep_one_admin() set schema private;

-- Policies call these as the signed-in user; the trigger doesn't need EXECUTE.
grant execute on function private.is_staff(), private.is_admin() to authenticated;
revoke execute on function private.keep_one_admin() from public, anon, authenticated;

create index prayer_days_updated_by_idx on public.prayer_days (updated_by);
