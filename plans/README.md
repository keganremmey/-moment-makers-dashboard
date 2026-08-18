# Animation plans — moment-makers-dashboard (Fortissimo)

Audited via `improve-animations` at commit `02f11f2`. This codebase's motion
is more developed than its sibling app and mostly already well-reasoned — the
card hover lift is deliberately transform+opacity-only (compositor-friendly,
documented in-code), and the loading skeletons correctly use Tailwind's
`motion-safe:animate-pulse`. One real, confirmed gap found.

| # | Title | Severity | Status |
|---|---|---|---|
| 001 | [Gate the territory-marker hover transform behind reduced-motion](001-territory-marker-reduced-motion.md) | HIGH | TODO |

## Recommended order

Only one plan — no ordering to consider.

## Not turned into plans (already right, or too minor)

- Card hover lift (`a.card:hover { transform: translateY(-3px); }` +
  pseudo-element opacity fade) — already correct, transform/opacity-only,
  explicitly documented as a deliberate choice in the CSS comments. Not a
  finding.
- Loading skeletons (`motion-safe:animate-pulse`) — already correctly gated.
  Not a finding.
- Card hover transition uses the generic `ease` keyword rather than a custom
  cubic-bezier. Real, but single-instance and low-leverage — noted here, not
  worth a plan on its own.
