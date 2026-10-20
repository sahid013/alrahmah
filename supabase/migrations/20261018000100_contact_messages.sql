-- Messages sent through the website's contact forms (/contact, funerals, Quran Academy).
-- Personal data: written only by the server (secret key, after validation and rate limiting);
-- staff can read them, mark them read/archived and delete them. No public access.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  form text not null check (form in ('general', 'funerals', 'quran-academy')),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 5000),
  -- Page the form was sent from.
  page text check (char_length(page) <= 300),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  -- Inbox the email notification went to, or why it wasn't sent.
  emailed_to text,
  email_error text,
  -- Keyed hash of the sender's IP, only to limit how many messages one sender can send.
  ip_hash text
);
comment on table public.contact_messages is 'Website contact form messages. Server writes; staff read, update status, delete.';
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index contact_messages_ip_idx on public.contact_messages (ip_hash, created_at);

alter table public.contact_messages enable row level security;
create policy "Staff read messages" on public.contact_messages
  for select to authenticated using ((select private.is_staff()));
create policy "Staff update messages" on public.contact_messages
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete messages" on public.contact_messages
  for delete to authenticated using ((select private.is_staff()));

-- Staff may only change the status; everything else is what the sender wrote.
revoke update on public.contact_messages from authenticated, anon;
grant update (status) on public.contact_messages to authenticated;
