# Adding a new client

A short checklist for onboarding a new client to their own private dashboard.
No coding needed — just filling in a file.

## 1. Pull their session history
Gather what Fathom/Granola has: session dates, summaries, wins, open
tasks, skills practiced, quotes, frameworks used.

## 2. Create their seed file
Copy `seed/ian-lynch.json` to `seed/<their-slug>.json` (e.g.
`seed/jane-doe.json`). Keep the exact same shape (`client`, `sessions`,
`wins`, `tasks`, `skills`, `skill_reps`, `frameworks`, `quotes`) and fill
in their real content in place of Ian's.

## 3. Answer the two flourish questions
Every dashboard looks the same — same layout, colors, fonts — except one
personal touch, set in the `client` object:

- **`identity_names[0]`** — one word for their bold, confident self. Ask
  them, or pull it from a session where they named it (like Ian's
  "Fortissimo").
- **`accent_hex`** — one color that feels like them. A hex code if you
  have one, or describe the color and pick the closest match yourself.
  This colors their identity word on their overview page — nothing else
  on the dashboard changes per client.

## 4. Run the seed script
```
npm run seed seed/<their-slug>.json
```
Creates (or updates) their row in Supabase.

## 5. Send them the link
The script's last line of output is their private URL
(`/d/<access_token>`). That's their whole dashboard, ready to send.
