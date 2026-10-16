-- Staff accounts (dashboard) and published prayer-time overrides.
-- Applied to project zjnqkenrsydswfxdgmpa via the Supabase MCP (migration "staff_and_prayer_days").

-- ---------- Staff ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '' check (char_length(name) <= 100),
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'Dashboard staff. Only users with a row here can edit site content.';

create function public.is_staff() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid())) $$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin') $$;

-- There is always at least one admin.
create function public.keep_one_admin() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'admin'
     and (tg_op = 'DELETE' or new.role <> 'admin')
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'There must always be at least one admin.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger profiles_keep_one_admin
before update or delete on public.profiles
for each row execute function public.keep_one_admin();

alter table public.profiles enable row level security;
create policy "Staff can see the team" on public.profiles
  for select to authenticated using ((select public.is_staff()));
create policy "Admins add staff" on public.profiles
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins change staff" on public.profiles
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins remove staff" on public.profiles
  for delete to authenticated using ((select public.is_admin()));

-- ---------- Prayer times ----------

-- "HH:mm" (24h).
create function public.is_clock_time(value text) returns boolean
language sql immutable set search_path = ''
as $$ select value ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' $$;

-- { fajr|dhuhr|asr|maghrib|isha: { adhan, jamaah? }, sunrise: { adhan } }
create function public.valid_prayer_times(times jsonb) returns boolean
language plpgsql immutable set search_path = ''
as $$
declare
  key text;
begin
  if jsonb_typeof(times) <> 'object' then return false; end if;
  foreach key in array array['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] loop
    if not public.is_clock_time(times -> key ->> 'adhan') then return false; end if;
    if times -> key ? 'jamaah' and not public.is_clock_time(times -> key ->> 'jamaah') then
      return false;
    end if;
  end loop;
  return true;
end $$;

create function public.valid_clock_times(times text[]) returns boolean
language sql immutable set search_path = ''
as $$ select coalesce(bool_and(public.is_clock_time(t)), true) from unnest(times) as t $$;

-- Only days the team edits are stored; every other day uses the published/calculated timetable.
create table public.prayer_days (
  date date primary key,
  times jsonb not null check (public.valid_prayer_times(times)),
  jumuah text[] check (jumuah is null or public.valid_clock_times(jumuah)),
  note text check (char_length(note) <= 200),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);
comment on table public.prayer_days is 'Prayer times edited in the dashboard (UK clock times). Public read; staff write.';

create function public.touch_updated() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

create trigger prayer_days_touch
before insert or update on public.prayer_days
for each row execute function public.touch_updated();

alter table public.prayer_days enable row level security;
create policy "Everyone can read prayer times" on public.prayer_days
  for select to anon, authenticated using (true);
create policy "Staff add prayer times" on public.prayer_days
  for insert to authenticated with check ((select public.is_staff()));
create policy "Staff change prayer times" on public.prayer_days
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff remove prayer times" on public.prayer_days
  for delete to authenticated using ((select public.is_staff()));

-- Helper functions aren't part of the public API.
revoke execute on function public.is_staff(), public.is_admin(), public.keep_one_admin()
  from public, anon;
