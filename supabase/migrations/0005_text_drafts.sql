-- Text drafts: Kegan's iMessage reply assistant.
--
-- A relay script on Kegan's Mac (scripts/imessage-relay.mjs) reads new texts
-- from the Messages database, posts them here, and Claude drafts a reply.
-- Kegan reviews each draft on /admin/<token>/texts and taps Send. The relay
-- picks up approved drafts and sends them through Messages, from his own
-- number. Nothing is sent without that tap.
--
-- Same access model as every other table: RLS on, zero policies, service
-- role only.

-- text_contacts: one row per person who texts Kegan (1:1 chats only).
-- handle is the phone number or email Messages uses for them.
-- mode 'ignore' tells the relay to stop uploading that person's texts at all.
create table if not exists text_contacts (
  handle text primary key,
  display_name text,
  client_id uuid references clients (id) on delete set null,
  mode text not null default 'draft' check (mode in ('draft', 'ignore')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table text_contacts enable row level security;

-- text_messages: the recent thread history the drafter reads. guid is the
-- Messages guid, so the relay can resend history without creating duplicates.
create table if not exists text_messages (
  id bigserial primary key,
  guid text not null unique,
  handle text not null references text_contacts (handle) on delete cascade,
  chat_guid text,
  is_from_me boolean not null,
  body text not null,
  sent_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table text_messages enable row level security;

create index if not exists text_messages_handle_sent_at_idx
  on text_messages (handle, sent_at desc);

-- text_drafts: one suggested reply per burst of incoming texts.
--   pending     waiting for Kegan
--   approved    Kegan tapped Send, waiting for the relay
--   sending     the relay claimed it
--   sent        Messages accepted it
--   failed      Messages refused it (error says why)
--   skipped     Kegan chose not to reply
--   superseded  a newer text came in, a fresh draft replaced this one
--   answered    Kegan replied from his phone before using the draft
create table if not exists text_drafts (
  id uuid primary key default gen_random_uuid(),
  handle text not null references text_contacts (handle) on delete cascade,
  chat_guid text,
  reply_to_guid text,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'sending', 'sent', 'failed', 'skipped', 'superseded', 'answered')
  ),
  category text check (category in ('routine', 'conversational', 'sensitive', 'no_reply')),
  urgency text check (urgency in ('now', 'today', 'whenever')),
  need text,
  fill_in text,
  draft_text text,
  final_text text,
  error text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  sent_at timestamptz
);

alter table text_drafts enable row level security;

create index if not exists text_drafts_status_idx on text_drafts (status, created_at desc);

-- At most one open draft per person, so a burst of five texts produces one
-- reply to review instead of five.
create unique index if not exists text_drafts_one_pending_per_handle
  on text_drafts (handle) where status = 'pending';
