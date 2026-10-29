-- Jumu'ah Giving (every Friday) uses a calendar icon on the "Select your cause" tiles.
alter table public.campaigns drop constraint campaigns_icon_check;
alter table public.campaigns
  add constraint campaigns_icon_check
  check (icon = any (array['mosque', 'people', 'moon', 'sun', 'calendar']));
