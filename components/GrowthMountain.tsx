import type { SkillRep } from "@/lib/data";
import { formatShortDate } from "@/lib/timeline";

// The flagship "look how far I've come" visual: a hand-rolled SVG area
// chart shaped like a rising mountain silhouette, plotting cumulative reps
// (all skills combined) against real time , same illustration language as
// FrameworkTerrainMap/valley-floor.svg (flat fills, layered opacity for
// depth, no gradients, no filters), no charting library. Fully server-
// renderable: static data computed once at request time, no client JS.
//
// Deliberately step-interpolated, not smoothed , real rep-logging happens
// in discrete jumps, so a staircase ridge is both the honest shape of the
// data and, happily, reads exactly like a mountain silhouette.

const VB_W = 720;
const VB_H = 260;
const PAD_L = 30; // room for the y-axis rep-count labels
const PAD_R = 34; // room for the gold summit marker at the right edge
const PAD_TOP = 46; // headroom so the marker's flag never clips the canvas
const BASELINE_Y = 208;
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = BASELINE_Y - PAD_TOP;
const GRIDLINE_FRACTIONS = [0.25, 0.5, 0.75, 1];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toUTCDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

function todayUTCDateStr(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

type StepPoint = { x: number; y: number };

/** Build an SVG path string for a step ("staircase") ridge line through a
 * sorted list of points, starting flat at the baseline from the left edge
 * and holding flat at the final value out to the right edge. */
function stepRidgePath(points: StepPoint[]): string {
  if (points.length === 0) return `M ${PAD_L} ${BASELINE_Y} L ${PAD_L + PLOT_W} ${BASELINE_Y}`;
  let d = `M ${PAD_L} ${BASELINE_Y}`;
  let prevY = BASELINE_Y;
  for (const p of points) {
    d += ` L ${p.x} ${prevY} L ${p.x} ${p.y}`;
    prevY = p.y;
  }
  d += ` L ${PAD_L + PLOT_W} ${prevY}`;
  return d;
}

function areaFillPath(ridgeD: string): string {
  return `${ridgeD} L ${PAD_L + PLOT_W} ${BASELINE_Y} L ${PAD_L} ${BASELINE_Y} Z`;
}

export function GrowthMountain({ reps }: { reps: SkillRep[] }) {
  const validReps = reps.filter((r) => r.date);
  const total = validReps.length;

  if (total === 0) {
    return (
      <section className="card p-6">
        <p className="label">Growth Mountain</p>
        <p className="mt-3 font-display text-3xl leading-snug text-ink">
          The climb starts with rep one.
        </p>
        <p className="mt-2 text-base text-ink-dim">
          Log a rep and this chart starts climbing with you.
        </p>
      </section>
    );
  }

  // Cumulative total by unique date, sorted ascending , the real shape of
  // the client's logging history, nothing invented in between.
  const sorted = [...validReps].sort((a, b) => a.date.localeCompare(b.date));
  const cumulativeByDate: { date: string; cumulative: number }[] = [];
  let running = 0;
  for (const rep of sorted) {
    const last = cumulativeByDate[cumulativeByDate.length - 1];
    running += 1;
    if (last && last.date === rep.date) {
      last.cumulative = running;
    } else {
      cumulativeByDate.push({ date: rep.date, cumulative: running });
    }
  }

  const firstDate = cumulativeByDate[0].date;
  const today = todayUTCDateStr();
  const spanDays = Math.max(
    1,
    Math.round((toUTCDate(today).getTime() - toUTCDate(firstDate).getTime()) / MS_PER_DAY)
  );

  const x = (dateStr: string) => {
    const days = Math.round(
      (toUTCDate(dateStr).getTime() - toUTCDate(firstDate).getTime()) / MS_PER_DAY
    );
    return PAD_L + Math.min(1, Math.max(0, days / spanDays)) * PLOT_W;
  };
  const y = (value: number) => BASELINE_Y - (value / total) * PLOT_H;

  const points: StepPoint[] = cumulativeByDate.map((d) => ({
    x: x(d.date),
    y: y(d.cumulative),
  }));

  const ridge = stepRidgePath(points);
  const area = areaFillPath(ridge);

  // A raised, paler echo of the same real ridge behind the solid one, for
  // depth , the same multi-layer-hill technique as valley-floor.svg's
  // farther/nearer ranges, not a second data series.
  const backPoints: StepPoint[] = points.map((p) => ({
    x: Math.max(PAD_L, p.x - 10),
    y: BASELINE_Y - (BASELINE_Y - p.y) * 0.82 - 10,
  }));
  const backRidge = stepRidgePath(backPoints);
  const backArea = areaFillPath(backRidge);

  const peak = points[points.length - 1];
  const finalX = PAD_L + PLOT_W;
  const finalY = peak.y;

  return (
    <section className="card p-6">
      <p className="label">Growth Mountain</p>
      <p className="mt-2 font-display text-5xl leading-none text-ink">
        {total} <span className="text-jade-dark">reps and climbing</span>
      </p>
      <p className="mt-2 text-sm text-ink-dim">
        {cumulativeByDate.length} logged session{cumulativeByDate.length === 1 ? "" : "s"} since{" "}
        {formatShortDate(firstDate)}
      </p>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="mt-4 h-auto w-full"
        role="img"
        aria-label={`Cumulative reps climbing from 0 to ${total} between ${formatShortDate(firstDate)} and today`}
      >
        {/* Scale gridlines with a rep-count label on each: turns the shape
            into a readable graph of scale, not just an evocative
            silhouette. Fractions of `total` so the labels are always real
            numbers, never rounded to a suspiciously clean figure. */}
        {GRIDLINE_FRACTIONS.map((frac) => {
          const gy = BASELINE_Y - frac * PLOT_H;
          const label = Math.round(frac * total);
          return (
            <g key={frac}>
              <line
                x1={PAD_L}
                y1={gy}
                x2={PAD_L + PLOT_W}
                y2={gy}
                stroke="var(--paper-line)"
                strokeWidth="1"
                opacity={frac === 1 ? 0 : 0.6}
              />
              <text
                x={PAD_L - 8}
                y={gy + 3.5}
                textAnchor="end"
                className="font-mono"
                fontSize="10"
                fill="var(--ink-dim)"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* baseline ground */}
        <line
          x1={PAD_L}
          y1={BASELINE_Y}
          x2={PAD_L + PLOT_W}
          y2={BASELINE_Y}
          stroke="var(--paper-line)"
          strokeWidth="1.5"
        />

        {/* back layer: paler, raised echo of the same real climb */}
        <path d={backArea} fill="var(--jade)" opacity="0.22" />

        {/* front layer: the real cumulative climb */}
        <path d={area} fill="var(--jade)" opacity="0.5" />
        <path d={ridge} fill="none" stroke="var(--jade-dark)" strokeWidth="2.5" strokeLinejoin="round" />

        {/* gold summit marker: today's total, the highest point reached */}
        <line x1={finalX} y1={finalY} x2={finalX} y2={finalY - 28} stroke="var(--ink)" strokeWidth="1.5" opacity="0.55" />
        <path
          d={`M ${finalX} ${finalY - 28} L ${finalX + 16} ${finalY - 21} L ${finalX} ${finalY - 14} Z`}
          fill="var(--gold)"
          stroke="var(--gold-bright)"
          strokeWidth="1"
        />
        <circle cx={finalX} cy={finalY} r="4.5" fill="var(--gold-bright)" stroke="var(--ink)" strokeWidth="1.25" />

        {/* date captions */}
        <text x={PAD_L} y={BASELINE_Y + 22} className="font-mono" fontSize="12" fill="var(--ink-dim)">
          {formatShortDate(firstDate)}
        </text>
        <text x={finalX} y={BASELINE_Y + 22} textAnchor="end" className="font-mono" fontSize="12" fill="var(--ink-dim)">
          today
        </text>
      </svg>
    </section>
  );
}
