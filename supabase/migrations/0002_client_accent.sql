-- accent_hex: the one deliberate per-client personalization point layered on
-- top of the shared Moment Makers design system (same palette/type/layout for
-- every client) — a single hex color, meaningful to that specific person,
-- used in exactly one flourish spot on their dashboard.
alter table clients add column if not exists accent_hex text;
