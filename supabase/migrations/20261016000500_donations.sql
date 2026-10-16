-- Donations recorded by the Stripe webhook (server, secret key). Personal data: staff can read,
-- nobody can write through the API (no insert/update/delete policies; the webhook bypasses RLS).
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  -- Stripe PaymentIntent (one-off) or Invoice (each regular payment) id: makes webhook retries idempotent.
  payment_ref text not null unique,
  payment_intent text,
  created_at timestamptz not null,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'GBP',
  type text not null check (type in ('one-off', 'recurring')),
  frequency text check (frequency in ('weekly', 'monthly', 'daily')),
  campaign_id text not null,
  status text not null default 'succeeded' check (status in ('succeeded', 'refunded')),
  -- Donor exactly as the donation form collects it (lib/giving/types.ts donorFields) + id.
  donor jsonb not null,
  marketing_consent boolean not null default false,
  subscription_id text,
  subscription_status text check (subscription_status in ('active', 'past_due', 'cancelled')),
  -- UTM source/medium/campaign, referrer and landing page captured on the visitor's arrival.
  source jsonb,
  stripe_customer text,
  recorded_at timestamptz not null default now()
);
comment on table public.donations is 'Payments recorded by the Stripe webhook. Staff read only.';
create index donations_created_at_idx on public.donations (created_at desc);
create index donations_subscription_idx on public.donations (subscription_id);
create index donations_payment_intent_idx on public.donations (payment_intent);

alter table public.donations enable row level security;
create policy "Staff can read donations" on public.donations
  for select to authenticated using ((select private.is_staff()));
