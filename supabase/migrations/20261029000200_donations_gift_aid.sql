-- Gift Aid on donations (client, October 2026: the masjid is registering with HMRC and wants the
-- records from the first website donation). Written only by the Stripe webhook (secret key);
-- staff read them through the existing "Staff can read donations" policy.
--   gift_aid              the donor declared Gift Aid (personal donations only)
--   gift_aid_declared_at  when they made the declaration on the donation form
--   gift_aid_declaration  the exact wording they agreed to (the charity's record for HMRC)
alter table public.donations
  add column gift_aid boolean not null default false,
  add column gift_aid_declared_at timestamptz,
  add column gift_aid_declaration text;

-- The Gift Aid export filters on it.
create index donations_gift_aid_idx on public.donations (created_at) where gift_aid;
