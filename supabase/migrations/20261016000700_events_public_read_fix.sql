-- NOT YET APPLIED (awaiting approval). Until it is, the website shows the events in code.
-- Fix: the public read policy called private.is_staff(), which anonymous visitors can't run, so
-- every public read failed. Visitors read published events; signed-in staff read everything.
drop policy "Everyone can read published events" on public.events;
create policy "Visitors read published events" on public.events
  for select to anon using (status = 'published');
create policy "Signed-in read published, staff read all" on public.events
  for select to authenticated using (status = 'published' or (select private.is_staff()));
