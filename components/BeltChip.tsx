import { BELT_COLORS, type BeltStatus } from "@/lib/belts";

// The signature element: an actual tied belt laid flat, drawn as a real SVG
// belt silhouette , a horizontal wrap strip with a folded knot and two
// tapered tails crossing at the fold, the classic flat-lay look of a tied
// karate/BJJ belt (not a striped progress-bar rectangle). Colored in rank,
// with the next rank's color creeping in from the strip's tip as reps
// accrue, mirroring how a real belt earns stripes on the way to a
// promotion. Static vector paint only , no filters, no per-frame animation.
export function BeltChip({ status }: { status: BeltStatus }) {
  const { belt, nextBelt, reps, repsToNext } = status;
  const color = BELT_COLORS[belt.name] ?? "var(--ink-dim)";
  const nextColor = nextBelt ? BELT_COLORS[nextBelt.name] : null;

  // --belt-white is pixel-identical to --paper-raised (the card background
  // this chip sits on), so a White-rank belt needs a stronger outline than
  // every other rank to stay legible , a darker, thicker ink stroke instead
  // of the default faint one. The fill itself stays the true --belt-white
  // token; a hairline-thin warm wash on top (drawn once, below) is what
  // actually separates it from the card, not a change to the token.
  const isWhite = belt.name === "White";
  const outline = isWhite ? "rgba(42, 27, 18, 0.8)" : "rgba(0,0,0,0.55)";
  const outlineWidth = isWhite ? 1.75 : 1.25;
  const stripOutline = isWhite ? "rgba(42, 27, 18, 0.8)" : "rgba(0,0,0,0.6)";
  const stripOutlineWidth = isWhite ? 1.75 : 1;
  const knotOutline = isWhite ? "rgba(42, 27, 18, 0.85)" : "rgba(0,0,0,0.65)";
  const knotOutlineWidth = isWhite ? 1.75 : 1;

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
        <path d="M40 28 L48 28 L34 54 L26 50 Z" fill={color} stroke={outline} strokeWidth={outlineWidth} />
        <path d="M40 28 L48 28 L62 50 L54 54 Z" fill={color} stroke={outline} strokeWidth={outlineWidth} />
        <path d="M40 28 L48 28 L34 54 L26 50 Z" fill="rgba(0,0,0,0.28)" />
        <line x1="36" y1="34" x2="29" y2="48" stroke={outline} strokeWidth={outlineWidth} />
        <line x1="52" y1="34" x2="58" y2="48" stroke={outline} strokeWidth={outlineWidth} />

        {/* main strip wrapping around */}
        <rect
          x={stripX}
          y="16"
          width={stripW}
          height="14"
          rx="3"
          fill={color}
          stroke={stripOutline}
          strokeWidth={stripOutlineWidth}
        />
        {isWhite && (
          <rect
            x={stripX}
            y="16"
            width={stripW}
            height="14"
            rx="3"
            fill="var(--ink)"
            opacity="0.06"
          />
        )}
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
          stroke={knotOutline}
          strokeWidth={knotOutlineWidth}
        />
        <path d="M30 12 L52 12 L44 23 L52 34 L30 34 L38 23 Z" fill="rgba(0,0,0,0.3)" />
        {isWhite && (
          <path
            d="M30 12 L52 12 L44 23 L52 34 L30 34 L38 23 Z"
            fill="var(--ink)"
            opacity="0.06"
          />
        )}
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
