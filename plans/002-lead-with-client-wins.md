# 002 — Lead the client dashboard with their own wins, not session logistics

- **Status**: TODO
- **Commit**: 02f11f2
- **Severity**: N/A (information architecture, not a bug)
- **Category**: Information ordering
- **Estimated scope**: 1-2 files (`app/d/[token]/page.tsx` and possibly `components/DashboardNav.tsx`)

## Problem

This dashboard is opened by the client themselves — not Kegan. The person
whose excitement matters most when this link is opened is the client, and
what makes a client want to keep opening their own coaching dashboard is
seeing evidence of their own progress, not administrative session details.
If the current landing view (`app/d/[token]/page.tsx`) leads with logistics
(session lists, dates, upcoming scheduling) before wins/progress, the first
few seconds of every visit are organized around Kegan's workflow, not the
client's motivation to return.

This plan requires verifying the actual current order first — read
`app/d/[token]/page.tsx` in full before assuming which section currently
leads, since this file may have changed since the dojo-redesign commits.

## Target

The client dashboard's landing view should present, in this order:

1. **Wins first** — the client's own recorded accomplishments/breakthroughs,
   ideally the most recent 2-3, prominent and visually rewarding (this repo
   already has a warm, materially-rich card treatment — wins should get the
   fullest version of it, not a muted list).
2. **Progress/skill state second** — whatever visual progress indicator
   already exists (belt/tier system, per the dojo theme) — this is still
   about the client seeing themselves growing, just one layer more
   structural than a raw win.
3. **Sessions/logistics last** — session history, dates, upcoming scheduling
   — still present and easy to find, just not the first thing rendered.

This is a reordering of existing sections, not new content — do not invent
new copy or data; move what's already there.

## Repo conventions to follow

- Read the actual current section order and component structure in
  `app/d/[token]/page.tsx` before changing anything — do not assume the
  order described in this plan's "Problem" section without confirming it.
- Preserve the per-client accent (`--client-accent` / the `.flourish`
  mechanism) wherever it's currently applied — reordering sections should
  not disturb which elements carry the client's accent color.
- Match the existing card/section visual treatment already in this file
  (the "raised lacquer/wood panel" card style) rather than inventing a new
  treatment for the promoted wins section — if wins should look even more
  prominent than a standard card, that's a legitimate follow-on idea but
  keep it in the same visual language (warm shadows, not a different style
  entirely).

## Steps

1. Read `app/d/[token]/page.tsx` fully and map its current section order
   (component by component, top to bottom).
2. Identify the wins section, the progress/skill-tier section, and the
   sessions/logistics section — note their current component names/paths.
3. Reorder the JSX so wins render first, progress/skill state second,
   sessions/logistics third — this may be a straightforward reordering of
   existing JSX blocks/component calls, or may require checking whether any
   section depends on layout position (e.g. a sidebar vs. main-column split)
   before moving it.
4. If the page uses a two-column layout (common for dashboards) rather than
   a single top-to-bottom stack, apply the same "wins/progress get primary
   visual weight" principle to column placement instead of vertical order —
   use judgment on which structure this file actually has before forcing a
   literal reorder that doesn't fit its layout.

## Boundaries

- Do NOT change what data each section shows — this is purely about order/
  prominence, not content.
- Do NOT touch the token-based access/auth mechanism.
- Do NOT change `components/DashboardNav.tsx`'s tab order unless the
  landing page itself is structured around those nav tabs rather than
  stacked sections — check which applies before deciding whether this plan
  touches that file at all.
- If wins, progress, and sessions turn out not to be cleanly separable
  sections in the current code (e.g. everything is interleaved in a way
  that resists reordering), STOP and report the actual structure rather than
  forcing an awkward reorder.

## Verification

- **Mechanical**: this repo's build/lint commands clean (check `package.json`
  scripts for exact names).
- **Feel check**:
  - Open a real client's dashboard (`/d/[token]` with a real seeded token —
    check what's already in Supabase rather than fabricating one).
  - Confirm the first thing visible on load is a win or recent
    accomplishment, not a session list or scheduling widget.
  - Confirm session/logistics data is still present and reachable, just not
    first.
  - Confirm the per-client accent color still renders correctly wherever it
    did before.
- **Done when**: a client opening their own link sees their own progress
  before administrative details, with nothing removed, only reordered.
