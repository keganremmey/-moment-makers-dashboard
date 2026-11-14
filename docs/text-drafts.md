# Text drafts

Someone texts you. Within about 30 seconds a reply drafted in your voice is
waiting at `/admin/<ADMIN_ACCESS_TOKEN>/texts`. You fix anything in
[brackets], tap **Send**, and your Mac sends it from your own number. Nothing
goes out until you tap.

## How it works

1. **Your Mac** runs `scripts/imessage-relay.mjs`. Every 5 seconds it reads
   new texts from the Messages app's database (read-only).
2. It posts each new 1:1 text, plus the last 20 messages of that thread, to
   the dashboard.
3. **The dashboard** asks Claude for a reply. Claude reads the thread, your
   notes on that person, and, if they are a coaching client, their last two
   session summaries and open homework. It sorts each draft as routine,
   conversation, handle with care, or no reply needed, and marks how urgent
   it is.
4. **You** review on the texts page. Send, Skip, or type a change ("shorter",
   "offer Thursday at 4") and tap Rewrite.
5. On its next check, the relay picks up what you approved and sends it
   through Messages.

If you answer from your phone first, the draft clears itself ("You replied
yourself"). If they send three texts in a row, you get one draft that answers
all three.

## What stays on your Mac

The relay never uploads:

- group chats
- short codes (bank alerts, 2FA codes, delivery updates)
- tapbacks, and photos with no text
- anyone you muted with **Stop drafting for this person**

To start with only a few people, set `TEXTS_ONLY_HANDLES` (below). Only those
numbers will upload.

## One-time setup

### 1. Database

Run `supabase/migrations/0005_text_drafts.sql` in the Supabase SQL editor.

### 2. Dashboard env vars (Vercel)

| Var | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | already set for Patterns |
| `ADMIN_ACCESS_TOKEN` | already set for the admin page |
| `TEXTS_RELAY_TOKEN` | new. Run `openssl rand -hex 32` and paste the result |
| `NTFY_TOPIC` | optional, for a phone ping (step 5) |
| `TEXTS_REVIEW_URL` | optional, the full texts page URL the ping opens |

Redeploy after adding them.

### 3. The relay's settings file on your Mac

```bash
mkdir -p ~/.moment-makers-relay
```

```bash
cat > ~/.moment-makers-relay/relay.env <<'EOF'
DASHBOARD_URL=https://YOUR-SITE.vercel.app
TEXTS_RELAY_TOKEN=the-same-value-as-on-vercel
# Optional: only these people, comma-separated, exactly as Messages stores them
# TEXTS_ONLY_HANDLES=+15125550101,+15125550102
EOF
```

### 4. Mac permissions

- **Messages in iCloud** has to be on (Messages > Settings > iMessage >
  Enable Messages in iCloud), so texts from your iPhone land on the Mac.
  Turn on **Text Message Forwarding** on the iPhone too (Settings > Apps >
  Messages > Text Message Forwarding) so green-bubble SMS come through.
- **Full Disk Access**: System Settings > Privacy & Security > Full Disk
  Access. Add your terminal app for testing. For the always-on version,
  also add the `node` binary (path from `which node`; press Cmd+Shift+G in
  the file picker to paste it).
- **Automation**: the first send pops up "node wants to control Messages".
  Click Allow.

Test it by hand first. This prints the last ~50 messages that would upload
and sends nothing:

```bash
node --env-file=$HOME/.moment-makers-relay/relay.env scripts/imessage-relay.mjs --dry-run
```

Then run it for real and text yourself from another phone:

```bash
node --env-file=$HOME/.moment-makers-relay/relay.env scripts/imessage-relay.mjs
```

The first real run starts from "now", so years of old texts never upload.

### 5. Optional phone ping

Install the free **ntfy** app on your iPhone, subscribe to a long random
topic name (e.g. `mm-texts-` plus `openssl rand -hex 8`), and set the same
name as `NTFY_TOPIC` on Vercel. The ping says "Reply draft ready" and opens
the texts page. It never includes the message or the person's name, because
anyone who guesses a topic name can read it.

### 6. Keep it running

Copy `scripts/com.momentmakers.imessage-relay.plist` to
`~/Library/LaunchAgents/`, replace the three `REPLACE_ME` paths, then:

```bash
launchctl load ~/Library/LaunchAgents/com.momentmakers.imessage-relay.plist
```

It now starts when you log in and restarts if it crashes. The log is at
`/tmp/moment-makers-relay.log`. Your Mac has to be awake: System Settings >
Battery (or Energy) > Options > "Prevent automatic sleeping when the display
is off" while plugged in.

## Day to day

- **Name people** with "Who is this?" on their first card. Link coaching
  clients so drafts can reference their sessions and homework. Notes like
  "my brother, keep it casual" change how every future draft sounds.
- **Muted someone by mistake?** In the Supabase SQL editor:
  `update text_contacts set mode = 'draft' where handle = '+15125550101';`
- **A send says "Stuck?"** The relay claimed it and never reported back,
  usually because the Mac slept mid-send. Check Messages on the Mac before
  tapping Retry, or they get it twice.

## What's next

Auto-send stays off for now. After a few weeks, once your edits are small,
the plan is to let one category at a time send without a tap (running-late
replies, confirmations), only to contacts you approve. Family, money and
anything marked "handle with care" always wait for you.
