-- Payment mode switch: which Stripe keys (live or test) new donations use. Read by the server
-- with the secret key on every new payment session, so changing it takes effect immediately.
-- No API access (RLS on, no policies): change it with SQL only.
create table public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  constraint stripe_mode_value check (key <> 'stripe_mode' or value in ('live', 'test'))
);
comment on table public.site_settings is 'Server-only settings (e.g. stripe_mode). No API access; change with SQL.';
alter table public.site_settings enable row level security;

insert into public.site_settings (key, value) values ('stripe_mode', 'test');

-- Test-mode payments are recorded too (to test the dashboard); mark them so they can be removed.
alter table public.donations add column livemode boolean not null default true;
comment on column public.donations.livemode is 'false = Stripe test-mode payment (delete before relying on totals).';
