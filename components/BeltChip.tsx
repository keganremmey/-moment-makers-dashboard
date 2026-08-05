import type { BeltStatus } from "@/lib/belts";

const BELT_COLORS: Record<string, string> = {
  White: "var(--belt-white)",
  Gray: "var(--belt-gray)",
  Blue: "var(--belt-blue)",
  Purple: "var(--belt-purple)",
  Brown: "var(--belt-brown)",
  Black: "var(--belt-black)",
};

// The signature element: an actual cloth belt laid flat, colored in rank,
// with stitch marks along its length. The next rank's color creeps in from
// the tip as reps accrue — mirroring how a real BJJ belt earns stripes at
// the tip on the way to a promotion, so the belt itself communicates
// progress, not just a static rank name.
export function BeltChip({ status }: { status: BeltStatus }) {
  const { belt, nextBelt, reps, repsToNext } = status;
  const color = BELT_COLORS[belt.name] ?? "var(--paper-dim)";
  const nextColor = nextBelt ? BELT_COLORS[nextBelt.name] : null;

  const progress = nextBelt
    ? Math.min(
        1,
        Math.max(0, (reps - belt.minReps) / (nextBelt.minReps - belt.minReps))
      )
    : 1;

  const description = nextBelt
    ? `${belt.name} belt, ${repsToNext} rep${repsToNext === 1 ? "" : "s"} to ${nextBelt.name}`
    : `${belt.name} belt, top rank`;

  return (
    <span className="belt" role="img" aria-label={description}>
      <span className="belt-strap" style={{ background: color }}>
        {nextColor && progress > 0 && (
          <span
            className="belt-strap-progress"
            style={{ width: `${progress * 100}%`, background: nextColor }}
          />
        )}
        <span className="belt-strap-stitch" />
      </span>
      <span className="belt-label">{belt.name}</span>
    </span>
  );
}
