-- Donors who ticked "Keep me updated" on the donation form: the email marketing list, one row per
-- email. Written only by the Stripe webhook (secret key) when a donation with consent is paid;
-- staff can read it, unsubscribe / resubscribe people and delete them (erasure requests).
-- Only what email marketing needs is kept (consent covers email, so no phone or address), plus
-- the record of consent: when, the donation it came with and the wording the donor agreed to.
create table public.mailing_list (
  email text primary key check (email = lower(email) and char_length(email) between 3 and 254),
  first_name text not null default '',
  last_name text not null default '',
  organisation text,
  city text,
  country text,
  subscribed boolean not null default true,
  -- Most recent opt-in: when, which cause, which payment / checkout session, and the wording shown.
  consented_at timestamptz not null,
  consent_campaign_id text,
  consent_ref text,
  consent_text text not null,
  unsubscribed_at timestamptz,
  -- false when the opt-in came with a Stripe test-mode donation.
  livemode boolean not null default true,
  updated_at timestamptz not null default now()
);
comment on table public.mailing_list is 'Email marketing opt-ins from the donation form. Webhook writes; staff read, (un)subscribe, delete.';
create index mailing_list_consented_at_idx on public.mailing_list (consented_at desc);

alter table public.mailing_list enable row level security;
create policy "Staff read mailing list" on public.mailing_list
  for select to authenticated using ((select private.is_staff()));
create policy "Staff update mailing list" on public.mailing_list
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete mailing list" on public.mailing_list
  for delete to authenticated using ((select private.is_staff()));

-- Staff may only change whether someone is subscribed; the consent record stays as given.
revoke update on public.mailing_list from authenticated, anon;
grant update (subscribed, unsubscribed_at, updated_at) on public.mailing_list to authenticated;

-- Opt-ins recorded before this table existed: each email's latest donation with consent.
insert into public.mailing_list (
  email, first_name, last_name, organisation, city, country,
  consented_at, consent_campaign_id, consent_ref, consent_text, livemode
)
select distinct on (lower(donor->>'email'))
  lower(donor->>'email'),
  coalesce(donor->>'firstName', ''),
  coalesce(donor->>'lastName', ''),
  nullif(donor->>'organisation', ''),
  nullif(donor->>'city', ''),
  nullif(donor->>'country', ''),
  created_at,
  campaign_id,
  payment_ref,
  'Keep me updated. I''d like to hear from Al-Rahmah Masjid by email about news, events and appeals. I can unsubscribe at any time.',
  livemode
from public.donations
where marketing_consent and coalesce(donor->>'email', '') like '%@%'
order by lower(donor->>'email'), created_at desc;
