-- intro_events: funnel log for the apartment-flyer landing page (/intro).
-- One row per step a visitor takes: page visit, booking button tap, and
-- the server-side redirect into the GoHighLevel free-20 calendar.
-- Confirmed, attended and paid bookings live in GoHighLevel, joined back by
-- the utm_* values passed through to the calendar URL.
--
-- Privacy: no IP address, no user agent, no cookies, no names or contact
-- details. visit_id is a random id held in the tab's sessionStorage so a
-- tap can be tied to its visit; it is never linked to a person.
create table if not exists intro_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  event text not null check (event in ('visit', 'cta_click', 'booking_redirect')),
  visit_id text,
  cta text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer_host text
);

alter table intro_events enable row level security;

create index if not exists intro_events_created_at_idx on intro_events (created_at);
create index if not exists intro_events_utm_content_idx on intro_events (utm_content);
