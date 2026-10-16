-- Which donation causes are shown on the website (switched in the dashboard). The causes
-- themselves (title, how they're given) live in the site's code; this only stores visibility.
create table public.donation_causes (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  visible boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);
comment on table public.donation_causes is 'Show/hide each donation cause on /donate and /donations. Public read; staff write.';
create index donation_causes_updated_by_idx on public.donation_causes (updated_by);

create trigger donation_causes_touch
before insert or update on public.donation_causes
for each row execute function public.touch_updated();

alter table public.donation_causes enable row level security;
create policy "Everyone can read cause visibility" on public.donation_causes
  for select to anon, authenticated using (true);
create policy "Staff add causes" on public.donation_causes
  for insert to authenticated with check ((select private.is_staff()));
create policy "Staff change causes" on public.donation_causes
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

-- Before Ramadan only the main appeal shows (client, 16 Oct 2026).
insert into public.donation_causes (id, visible) values
  ('masjid-expansion', true),
  ('fitrana', false),
  ('last-10-nights', false),
  ('first-10-days-dhul-hijjah', false);
