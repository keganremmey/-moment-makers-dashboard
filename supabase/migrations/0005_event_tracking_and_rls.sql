-- 0005: event funnel tracking, last name on leads, and RLS on four tables.
--
-- 1. bup_results.last_name: the event form now collects a last name. The
--    dashboard relay saves it here after the lead is created.
-- 2. Row Level Security on quests, quest_encounters, quest_logs and
--    framework_examples. This app only reads them with the service-role key,
--    which bypasses RLS, so default-deny changes nothing for the app and
--    closes public access through the anon key.
-- 3. Two read-only views over bup_events for the event funnel. They run with
--    the caller's rights (security_invoker), so only the service role sees them.

alter table public.bup_results add column if not exists last_name text;

alter table public.quests enable row level security;
alter table public.quest_encounters enable row level security;
alter table public.quest_logs enable row level security;
alter table public.framework_examples enable row level security;

create index if not exists bup_events_event_created_idx on public.bup_events (event, created_at);
create index if not exists bup_events_result_idx on public.bup_events (result_id);

-- One row per day: how many distinct people reached each step.
create or replace view public.bup_event_funnel_daily with (security_invoker = true) as
select
  (e.created_at at time zone 'America/Chicago')::date as day,
  count(distinct e.session_id) filter (where e.event = 'landing_page_view') as landing_views,
  count(distinct e.session_id) filter (where e.event = 'contact_form_started') as form_started,
  count(distinct e.session_id) filter (where e.event = 'contact_form_completed') as form_completed,
  count(distinct e.session_id) filter (where e.event = 'assessment_started') as quiz_started,
  count(distinct e.session_id) filter (where e.event = 'assessment_completed') as quiz_completed,
  count(distinct e.result_id) filter (where e.event = 'results_page_view') as results_viewed,
  count(distinct e.result_id) filter (where e.event = 'results_scroll_milestone' and (e.props->>'pct')::int >= 50) as scrolled_50,
  count(distinct e.result_id) filter (where e.event = 'results_scroll_milestone' and (e.props->>'pct')::int >= 100) as scrolled_100,
  count(distinct e.result_id) filter (where e.event in ('booking_clicked', 'results_cta_click')) as clicked_fit_call
from public.bup_events e
where e.props->>'version' = 'event-v1'
group by 1;

-- One row per event taker: who they are and what they did.
create or replace view public.bup_event_engagement with (security_invoker = true) as
select
  r.id as result_id,
  r.created_at,
  r.first_name,
  r.last_name,
  r.phone,
  r.email,
  r.status,
  r.primary_pattern,
  round(max((e.props->>'total_ms')::numeric) filter (where e.event = 'quiz_timing') / 1000) as quiz_seconds,
  round(max((e.props->>'ms')::numeric) filter (where e.event = 'contact_form_timing') / 1000) as form_seconds,
  count(*) filter (where e.event = 'results_page_view') as results_page_views,
  round(max((e.props->>'active_ms')::numeric) filter (where e.event = 'results_time_on_page') / 1000) as seconds_on_results,
  max((e.props->>'pct')::int) filter (where e.event = 'results_scroll_milestone') as max_scroll_pct,
  count(distinct e.props->>'section') filter (where e.event = 'results_section_reached') as sections_reached,
  (r.booking_clicked or bool_or(e.event = 'results_cta_click')) as clicked_fit_call,
  round(min((e.props->>'ms_since_load')::numeric) filter (where e.event = 'results_cta_click') / 1000) as seconds_to_click,
  bool_or(e.event = 'results_pdf_click') as clicked_pdf
from public.bup_results r
left join public.bup_events e on e.result_id = r.id
where r.assessment_version = 'event-v1'
group by r.id;
