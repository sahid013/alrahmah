-- Events & courses, edited in the dashboard and read by the website. Posters in Storage.
create table public.events (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 150),
  category text not null check (category in ('course', 'community', 'youth', 'sisters')),
  -- {"kind":"once","date":...} | {"kind":"weekly","weekday":...} (validated by lib/events/types.ts)
  schedule jsonb not null check (schedule ? 'kind'),
  schedule_label text check (char_length(schedule_label) <= 120),
  summary text not null check (char_length(summary) between 1 and 600),
  description text check (char_length(description) <= 5000),
  speaker text check (char_length(speaker) <= 120),
  location text check (char_length(location) <= 160),
  -- {"src","alt","width","height"}
  image jsonb,
  href text check (char_length(href) <= 500),
  status text not null default 'published' check (status in ('published', 'draft')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);
comment on table public.events is 'Events & courses. Published rows are public; staff see and edit all.';
create index events_updated_by_idx on public.events (updated_by);

create trigger events_touch
before insert or update on public.events
for each row execute function public.touch_updated();

alter table public.events enable row level security;
create policy "Everyone can read published events" on public.events
  for select to anon, authenticated using (status = 'published' or (select private.is_staff()));
create policy "Staff add events" on public.events
  for insert to authenticated with check ((select private.is_staff()));
create policy "Staff change events" on public.events
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff remove events" on public.events
  for delete to authenticated using ((select private.is_staff()));

-- The events that were in the site's code (posters stay in /public/images/events).
insert into public.events (id, title, category, schedule, schedule_label, summary, speaker, image, sort_order) values
  ('seerah-of-muhammad', 'Seerah of Muhammad ﷺ', 'course',
   '{"kind":"weekly","weekday":"Friday","time":"After Asr"}', 'Every Friday After Asr',
   'Learn more about the life of our beloved messenger ﷺ and the lessons we can implement from his life.',
   'Ustadh Umar Muqaddam',
   '{"src":"/images/events/seerah-of-muhammad-poster.webp","width":1000,"height":1412,"alt":"Seal of the Prophets poster — Seerah of Prophet Muhammad ﷺ and lessons learned, by Ustadh Umar Muqaddam"}', 0),
  ('umdatul-ahkaam', 'Umdatul-Ahkaam', 'course',
   '{"kind":"weekly","weekday":"Monday","time":"After Asr"}', 'Monday after Asr',
   'Join us as we go through the book Umdatul Ahkaam written by the esteemed Imam Abd al-Ghani al-Maqdisi. It is a chance to learn Fiqh and to ask questions you may have',
   'Ustadh Hussain Sattar',
   '{"src":"/images/events/umdatul-ahkaam-poster.webp","width":1000,"height":1416,"alt":"''Umdatul-Ahkaam poster — a foundational guide to fiqh through authentic hadeeth, delivered by Ustadh Hussain Sattar"}', 1),
  ('names-of-allaah', 'Names of Allaah', 'course',
   '{"kind":"weekly","weekday":"Thursday","time":"After Asr"}', 'Thursday after Asr',
   'Learn more about our Lord, verily when we increase in our knowledge of Him. We increase in our love for Him and our fear of Him also increases. We go through the book Fiqh Al-Asma Al-Husna – by Shaykh ‘Abd Al-Razzaq Al-Badr',
   'Ustadh Umar Muqaddam',
   '{"src":"/images/events/names-of-allaah-poster.webp","width":1000,"height":1399,"alt":"Understanding the Beautiful Names of Allaah poster, by Ustadh Umar Muqaddam"}', 2);

-- Posters: public to read (via public URLs), staff to upload/replace/delete. Max 5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-posters', 'event-posters', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Staff upload event posters" on storage.objects
  for insert to authenticated with check (bucket_id = 'event-posters' and (select private.is_staff()));
create policy "Staff replace event posters" on storage.objects
  for update to authenticated using (bucket_id = 'event-posters' and (select private.is_staff()));
create policy "Staff delete event posters" on storage.objects
  for delete to authenticated using (bucket_id = 'event-posters' and (select private.is_staff()));
create policy "Staff read event posters" on storage.objects
  for select to authenticated using (bucket_id = 'event-posters' and (select private.is_staff()));
