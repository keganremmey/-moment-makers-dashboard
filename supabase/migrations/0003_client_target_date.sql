-- Target date for the client's stated mission/deadline (e.g. Ian's own
-- "By September" language from his North Star). Nullable — not every
-- client will have named a specific deadline. The "started" date is
-- deliberately NOT stored here — it's derived from MIN(sessions.date)
-- for that client, since that's already real data rather than a second
-- field that could drift out of sync with it.
alter table clients add column if not exists target_date date;
