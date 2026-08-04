-- Fortissimo Dashboard — initial schema
--
-- Access model: no end-user auth. Every table has RLS enabled with ZERO
-- policies (default-deny for anon/authenticated). All reads and writes in
-- this app go through the Supabase service-role key, used only in Next.js
-- Server Components / Route Handlers. The service role bypasses RLS by
-- design, so default-deny here simply means "nothing is reachable from the
-- browser, ever" — the client-facing access token is enforced in
-- application code, not in Postgres policies.

-- clients: one row per coaching client. slug + access_token both act as
-- lookup keys; access_token is the entire "auth" system (a long random
-- token embedded in the client's private URL, e.g. /d/<access_token>).
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  program text,
  identity_names text[] not null default '{}',
  default_self_names text[] not null default '{}',
  north_star text,
  access_token text not null unique,
  created_at timestamptz not null default now()
);

alter table clients enable row level security;

-- sessions: one row per coaching call. fathom_id is the natural key used by
-- the seed script to make re-runs idempotent. Transcript text is never
-- stored here on purpose — sessions page links out to fathom_url instead.
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  fathom_id bigint not null unique,
  fathom_url text not null,
  date date not null,
  title text not null,
  session_number int,
  purpose text,
  summary_md text,
  created_at timestamptz not null default now()
);

alter table sessions enable row level security;

create index if not exists sessions_client_id_idx on sessions (client_id);

-- wins: real accomplishments surfaced on calls.
create table if not exists wins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  date date not null,
  title text not null,
  description text,
  source_session_fathom_id bigint references sessions (fathom_id),
  created_at timestamptz not null default now()
);

alter table wins enable row level security;

create index if not exists wins_client_id_idx on wins (client_id);

-- Natural key for re-running the seed script idempotently (a client
-- shouldn't accumulate duplicate wins each time seed.mjs runs). A unique
-- index (rather than a table constraint) so `create ... if not exists`
-- is valid Postgres and the migration stays safely re-runnable itself.
create unique index if not exists wins_client_date_title_key
  on wins (client_id, date, title);

-- tasks: homework / commitments. status is the only thing this app writes
-- from the browser (via the toggle route handler), and even that write
-- re-checks the access token server-side before touching a row.
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  title text not null,
  note text,
  status text not null default 'open' check (status in ('open', 'done', 'slipped')),
  assigned_date date,
  source_session_fathom_id bigint references sessions (fathom_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;

create index if not exists tasks_client_id_idx on tasks (client_id);

-- Natural key for idempotent seeding. Deliberately excludes `status` so the
-- seed script can update a task's title/note/date on rerun without ever
-- clobbering a status the client has already toggled done in the app.
create unique index if not exists tasks_client_title_date_key
  on tasks (client_id, title, assigned_date);

-- skills: global catalog of trainable skills (belt/level system applies
-- per client, per skill — see skill_reps). Not client-specific because the
-- same skill catalog is meant to be reused across future clients.
create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text
);

alter table skills enable row level security;

-- skill_reps: one row per logged rep of a skill for a given client. Belt
-- tier is derived at read time from cumulative rep count per skill, using
-- the thresholds in lib/belts.ts (coaching methodology, not per-client
-- data — deliberately not a table).
create table if not exists skill_reps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  skill_id uuid not null references skills (id) on delete cascade,
  date date not null,
  note text,
  source_session_fathom_id bigint references sessions (fathom_id),
  created_at timestamptz not null default now()
);

alter table skill_reps enable row level security;

create index if not exists skill_reps_client_id_idx on skill_reps (client_id);
create index if not exists skill_reps_skill_id_idx on skill_reps (skill_id);

-- Natural key for idempotent seeding (reps have no other mutable state, so
-- a straightforward upsert-on-conflict is safe here).
create unique index if not exists skill_reps_client_skill_date_note_key
  on skill_reps (client_id, skill_id, date, note);

-- frameworks: global reference library of coaching frameworks. Not
-- client-specific for the same reason as skills, though each framework
-- links back to the session it was first introduced in.
create table if not exists frameworks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text,
  steps text[] not null default '{}',
  source_session_fathom_id bigint references sessions (fathom_id)
);

alter table frameworks enable row level security;

-- quotes: verbatim lines worth keeping. client_id is nullable because a
-- quote could in principle be general coaching wisdom rather than
-- something said in a specific client's session.
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  attributed_to text,
  context text,
  source_session_fathom_id bigint references sessions (fathom_id),
  client_id uuid references clients (id) on delete cascade
);

alter table quotes enable row level security;

create index if not exists quotes_client_id_idx on quotes (client_id);

-- Natural key for idempotent seeding.
create unique index if not exists quotes_text_session_key
  on quotes (text, source_session_fathom_id);
