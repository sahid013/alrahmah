-- Campaigns (donation causes) and khutbahs, edited in the dashboard and read by the website.
-- Campaign `status` replaces donation_causes.visible: active = shown on the website.

create table public.campaigns (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 120),
  summary text check (char_length(summary) <= 400),
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  sort_order integer not null default 0,
  -- How people give: {"kind":"regular"} | per-person | daily (validated by the site, see lib/donations/types.ts)
  giving jsonb not null default '{"kind":"regular"}' check (giving ? 'kind'),
  icon text check (icon in ('mosque', 'people', 'moon', 'sun')),
  price jsonb,
  tracker jsonb,
  image jsonb,
  cta_label text not null default 'Donate' check (char_length(cta_label) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);
comment on table public.campaigns is 'Donation causes shown on /donate and /donations (status active). Public read; staff write.';
create index campaigns_updated_by_idx on public.campaigns (updated_by);

create trigger campaigns_touch
before insert or update on public.campaigns
for each row execute function public.touch_updated();

alter table public.campaigns enable row level security;
create policy "Everyone can read campaigns" on public.campaigns
  for select to anon, authenticated using (true);
create policy "Staff add campaigns" on public.campaigns
  for insert to authenticated with check ((select private.is_staff()));
create policy "Staff change campaigns" on public.campaigns
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff remove campaigns" on public.campaigns
  for delete to authenticated using ((select private.is_staff()));

-- The four causes from the site's code, keeping today's shown/hidden choices.
insert into public.campaigns (id, title, summary, status, sort_order, giving, icon, cta_label) values
  ('masjid-expansion', 'Masjid Expansion',
   'Help us move to a larger home through the Make Space for Rahmah appeal. Give once, weekly or monthly.',
   'draft', 0, '{"kind":"regular"}', 'mosque', 'Donate'),
  ('fitrana', 'Fitrana',
   'Zakat al-Fitr, paid for each member of your household before the Eid prayer.',
   'draft', 1, '{"kind":"per-person","unitAmount":5,"maxPeople":20}', 'people', 'Donate'),
  ('last-10-nights', 'Last 10 Nights',
   'Give every night of the last ten nights of Ramadan, so your charity reaches Laylatul Qadr.',
   'draft', 2, '{"kind":"daily","firstDate":"2027-02-27","count":10,"unit":"night","chargeTime":"21:00","periodLabel":"the last 10 nights of Ramadan","presets":[1,5,10,20]}', 'moon', 'Donate'),
  ('first-10-days-dhul-hijjah', 'First 10 Days of Dhul Hijjah',
   'The best days of the year: give every day from 1 to 10 Dhul Hijjah, up to the day of Eid.',
   'draft', 3, '{"kind":"daily","firstDate":"2027-05-07","count":10,"unit":"day","chargeTime":"09:00","periodLabel":"the first 10 days of Dhul Hijjah","presets":[1,5,10,20]}', 'sun', 'Donate');

update public.campaigns c set status = 'active'
from public.donation_causes d where d.id = c.id and d.visible;

-- donation_causes is dropped in a later migration, once the site reading campaigns is deployed
-- (the previous deploy still reads it).

-- Khutbahs posted by link in the dashboard (newest by date = "This week" on the home page).
create table public.khutbahs (
  video_id text primary key check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null check (char_length(title) between 1 and 150),
  speaker text check (char_length(speaker) <= 80),
  date date not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);
comment on table public.khutbahs is 'Khutbah videos for the home page. Public read; staff write.';
create index khutbahs_date_idx on public.khutbahs (date desc);
create index khutbahs_updated_by_idx on public.khutbahs (updated_by);

create trigger khutbahs_touch
before insert or update on public.khutbahs
for each row execute function public.touch_updated();

alter table public.khutbahs enable row level security;
create policy "Everyone can read khutbahs" on public.khutbahs
  for select to anon, authenticated using (true);
create policy "Staff add khutbahs" on public.khutbahs
  for insert to authenticated with check ((select private.is_staff()));
create policy "Staff change khutbahs" on public.khutbahs
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff remove khutbahs" on public.khutbahs
  for delete to authenticated using ((select private.is_staff()));
