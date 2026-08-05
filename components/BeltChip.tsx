import type { BeltStatus } from "@/lib/belts";

const BELT_COLORS: Record<string, string> = {
  White: "var(--belt-white)",
  Gray: "var(--belt-gray)",
  Blue: "var(--belt-blue)",
  Purple: "var(--belt-purple)",
  Brown: "var(--belt-brown)",
  Black: "var(--belt-black)",
};

// The signature element: an actual tied belt laid flat, drawn as a real SVG
// belt silhouette — a horizontal wrap strip with a folded knot and two
// tapered tails crossing at the fold, the classic flat-lay look of a tied
// karate/BJJ belt (not a striped progress-bar rectangle). Colored in rank,
// with the next rank's color creeping in from the strip's tip as reps
// accrue, mirroring how a real belt earns stripes on the way to a
// promotion. Static vector paint only — no filters, no per-frame animation.
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

  // Main wrap strip runs x 34–104 (70 wide); the next-rank color creeps in
  // from the right tip as reps accrue.
  const stripX = 34;
  const stripW = 70;
  const progressW = progress * stripW;

  return (
    <span className="belt" role="img" aria-label={description}>
      <svg className="belt-svg" viewBox="0 0 108 56" width="108" height="56" aria-hidden="true">
        {/* two tapered tails, hanging down and crossing at the fold */}
        <path d="M40 28 L48 28 L34 54 L26 50 Z" fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        <path d="M40 28 L48 28 L62 50 L54 54 Z" fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        <path d="M40 28 L48 28 L34 54 L26 50 Z" fill="rgba(0,0,0,0.28)" />
        <line x1="36" y1="34" x2="29" y2="48" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        <line x1="52" y1="34" x2="58" y2="48" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />

        {/* main strip wrapping around */}
        <rect
          x={stripX}
          y="16"
          width={stripW}
          height="14"
          rx="3"
          fill={color}
          stroke="rgba(0,0,0,0.45)"
          strokeWidth="1"
        />
        {nextColor && progressW > 0 && (
          <rect
            x={stripX + stripW - progressW}
            y="16"
            width={progressW}
            height="14"
            rx="3"
            fill={nextColor}
          />
        )}
        <line
          x1={stripX + 4}
          y1="19"
          x2={stripX + stripW - 4}
          y2="19"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <line
          x1={stripX + 4}
          y1="27"
          x2={stripX + stripW - 4}
          y2="27"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* folded knot: where the strip doubles back over itself */}
        <path
          d="M30 12 L52 12 L44 23 L52 34 L30 34 L38 23 Z"
          fill={color}
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="1"
        />
        <path d="M30 12 L52 12 L44 23 L52 34 L30 34 L38 23 Z" fill="rgba(0,0,0,0.3)" />
      </svg>
      <span className="flex items-baseline gap-2">
        <span className="belt-label">{belt.name}</span>
        <span className="belt-caption">
          {nextBelt ? `${repsToNext} to ${nextBelt.name}` : "top rank"}
        </span>
      </span>
    </span>
  );
}
