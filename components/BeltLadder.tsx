import { BELTS, BELT_COLORS } from "@/lib/belts";

// The full roadmap: all 6 ranks in one place, so a client can see the whole
// system ahead of him, not just the rank he happens to be sitting at right
// now. A reference/roadmap element (rendered once), not a per-skill status
// chip , BeltChip already covers "where is this one skill right now."
//
// Rendered top-to-bottom as a climb: Black (the summit) at top, White (day
// one) at the bottom, each rung stepped further left as rank drops, so the
// list itself reads as a staircase. `currentBeltName` marks the highest
// rank reached so far , rungs at or below it read as "reached," rungs above
// it stay fully legible (this is the roadmap ahead, not a locked mystery)
// but visually unmarked as not-yet-reached.
export function BeltLadder({
  currentBeltName,
  compact = false,
}: {
  currentBeltName?: string | null;
  compact?: boolean;
}) {
  const currentIndex = currentBeltName ? BELTS.findIndex((b) => b.name === currentBeltName) : -1;
  const rungs = [...BELTS].reverse();

  return (
    <ol className="flex flex-col">
      {rungs.map((belt) => {
        const idx = BELTS.findIndex((b) => b.name === belt.name);
        const isReached = currentIndex >= 0 && idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        const color = BELT_COLORS[belt.name] ?? "var(--ink-dim)";
        // Staircase indent: Black sits flush left, White sits furthest in,
        // so the list silhouette itself climbs like the mountain metaphor.
        const indent = (BELTS.length - 1 - idx) * (compact ? 8 : 14);

        return (
          <li
            key={belt.name}
            style={{ marginLeft: `${indent}px` }}
            className={`flex items-start gap-3 border-b border-paper-line py-2 last:border-none ${
              isCurrent ? "rounded-md border border-gold bg-paper px-2" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 flex-none rounded-full border-[1.5px]"
              style={{
                background: isReached ? color : "var(--paper-raised)",
                borderColor: "rgba(42, 27, 18, 0.55)",
              }}
            />
            <div className="min-w-0">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="belt-label text-ink">{belt.name}</span>
                <span className="font-mono text-xs text-ink-dim">{belt.minReps} reps</span>
                {isCurrent && (
                  <span className="font-mono text-xs uppercase tracking-wide text-gold-bright">
                    · you are here
                  </span>
                )}
              </p>
              <p className={`text-ink-dim ${compact ? "text-xs" : "text-sm"} mt-0.5`}>
                {belt.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
