# 001 — Gate the territory-marker hover transform behind reduced-motion

- **Status**: DONE
- **Commit**: 02f11f2
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 1 file, 1 rule

## Problem

`app/globals.css:236` animates the territory-marker dot's rotation and scale
on hover/open, unconditionally:

```css
/* app/globals.css:236 — current */
.territory-marker-dot {
  /* ... */
  transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}

.territory-marker:hover .territory-marker-dot,
.territory-marker.is-open .territory-marker-dot {
  background: var(--jade);
  border-color: var(--paper);
  transform: rotate(-45deg) scale(1.18);
}
```

This app does have a reduced-motion query, but it only covers a different
element:

```css
/* app/globals.css:316 — for reference only, do not edit */
@media (prefers-reduced-motion: no-preference) {
  .map-node-dot,
  .map-node-label {
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      opacity 0.15s ease;
  }
}
```

`.territory-marker-dot` is a different selector and is not inside that
block. A user with `prefers-reduced-motion: reduce` set still gets a
rotating, scaling transform every time they hover or open a territory marker
on the map — this is HIGH severity rather than MEDIUM because it's a
transform-based animation (the category most likely to cause discomfort for
vestibular-sensitive users), not just a color fade, and the map is a primary
interactive surface in this app, not an occasional element.

## Target

```css
/* app/globals.css:236 — target */
.territory-marker-dot {
  /* ... unchanged ... */
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

@media (prefers-reduced-motion: no-preference) {
  .territory-marker-dot {
    transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
  }
}
```

The color/border transitions stay unconditional (safe under any motion
preference); only the `transform` piece moves inside the `no-preference`
guard, mirroring this repo's own existing pattern for `.map-node-dot` at
line 316 rather than inventing a new one.

## Repo conventions to follow

This repo already uses the `@media (prefers-reduced-motion: no-preference)`
wrapper pattern — do not switch to Tailwind's `motion-safe:` variant here (as
used in the sibling `personal-oracle` app); stay consistent with this repo's
own established idiom. Exemplar: `app/globals.css:316` (`.map-node-dot,
.map-node-label`).

## Steps

1. In `app/globals.css`, find the `.territory-marker-dot` rule (currently at
   line ~228-238, containing the `transition: transform 0.15s ease,
   background-color 0.15s ease, border-color 0.15s ease;` declaration).
   Remove `transform 0.15s ease, ` from that transition list, leaving only
   `background-color 0.15s ease, border-color 0.15s ease;`.
2. Add a new block, placed near the existing `@media
   (prefers-reduced-motion: no-preference)` block at line 316 (either inside
   the same block, adding `.territory-marker-dot` to its selector list, or as
   a second adjacent block — either is acceptable):
   ```css
   @media (prefers-reduced-motion: no-preference) {
     .territory-marker-dot {
       transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
     }
   }
   ```
   Note this re-declares all three properties inside the guarded block
   (overriding the un-guarded two-property rule from step 1) so
   full-motion users get the complete original transition, and
   reduced-motion users get only the color/border piece.

## Boundaries

- Do NOT change the rotation angle (`-45deg`), scale factor (`1.18`), or any
  color values.
- Do NOT touch `.map-node-dot`, `.map-node-label`, or any other selector.
- Do NOT touch `components/FrameworkTerrainMap.tsx` — this is a CSS-only fix.
- If the cited line numbers or code have drifted since commit `02f11f2`,
  STOP and report instead of guessing.

## Verification

- **Mechanical**: this repo's build/lint commands (check `package.json`
  `scripts` for the exact names) must stay clean.
- **Feel check**:
  - In Chrome DevTools, Rendering panel, emulate
    `prefers-reduced-motion: reduce`.
  - Hover a territory marker on the map. Confirm the color/border still
    change (feedback is preserved) but the marker does NOT rotate or scale.
  - Switch emulation off and hover again — confirm the full rotate+scale
    animation still plays exactly as before.
  - In the Animations panel at 10% playback, confirm the transform genuinely
    animates from 0deg/1.0 scale to -45deg/1.18 scale under normal motion.
- **Done when**: reduced-motion users get color feedback only, full-motion
  users see no change in behavior from before this fix.
