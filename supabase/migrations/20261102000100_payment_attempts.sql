-- Protection against card-testing attacks on the donation form (marketing team, November 2026).
-- One row per payment session the form starts. Written and read only by the server (secret key):
--   ip_hash           keyed hash of the visitor's IP (never stored in the clear), for the limits
--                     on how many sessions one visitor can start
--   checkout_session  the Stripe Checkout Session, closed after too many declined cards
--   failures          declined cards / failed attempts on that session (Stripe webhook)
-- Rows older than a week are deleted as new ones are added.
create table public.payment_attempts (
  event_id text primary key,
  created_at timestamptz not null default now(),
  ip_hash text,
  checkout_session text not null,
  livemode boolean not null,
  failures integer not null default 0
);

create index payment_attempts_ip_idx on public.payment_attempts (ip_hash, created_at);

-- RLS on with no policies: nothing is readable or writable through the public API.
alter table public.payment_attempts enable row level security;

-- Counts one failed attempt and returns the new total (atomic, so retried webhooks and
-- simultaneous failures are never lost).
create function public.note_payment_failure(p_event_id text)
returns table (failures integer, checkout_session text, livemode boolean)
language sql
security definer
set search_path = ''
as $$
  update public.payment_attempts as a
  set failures = a.failures + 1
  where a.event_id = p_event_id
  returning a.failures, a.checkout_session, a.livemode;
$$;

revoke execute on function public.note_payment_failure(text) from public, anon, authenticated;
grant execute on function public.note_payment_failure(text) to service_role;
