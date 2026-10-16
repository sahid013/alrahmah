-- NOT YET APPLIED: run after the site reading `campaigns` is deployed.
-- Run AFTER the site that reads `campaigns` is deployed: cause visibility moved to campaigns.status.
drop table if exists public.donation_causes;
