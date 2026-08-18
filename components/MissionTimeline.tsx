import { formatShortDate, type ProgramTimeline } from "@/lib/timeline";

// Real, publicly attributed Rumi lines (not invented) , used sparingly, one
// per milestone tick, cycling if there are more ticks than quotes. This is
// published poetry in the public domain, not a claim about anything Ian or
// Kegan said, so it doesn't fall under this app's "never fabricate client
// content" rule the way an invented coaching quote would.
const RUMI_LINES = [
  "You were born with wings, why prefer to crawl through life?",
  "Let yourself be silently drawn by the strange pull of what you really love.",
  "The wound is the place where the light enters you.",
  "Respond to every call that excites your spirit.",
  "What you seek is seeking you.",
  "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
];

type Milestone = {
  day: number;
  dateStr: string;
  passed: boolean;
  isFinal: boolean;
  quote: string;
};

function addDays(startedOn: string, days: number): string {
  const d = new Date(startedOn + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ~6 evenly spaced milestones, rounded to a "nice" 5-day number so the
 * ticks read as real markers instead of an arbitrary fraction. */
function buildMilestones(timeline: ProgramTimeline): Milestone[] {
  const rawInterval = timeline.totalDays / 6;
  const interval = Math.max(5, Math.round(rawInterval / 5) * 5);

  const days: number[] = [];
  for (let d = interval; d < timeline.totalDays; d += interval) {
    days.push(d);
  }
  days.push(timeline.totalDays);

  return days.map((day, i) => ({
    day,
    dateStr: addDays(timeline.startedOn, day),
    passed: timeline.elapsedDays >= day,
    isFinal: day === timeline.totalDays,
    quote: RUMI_LINES[i % RUMI_LINES.length],
  }));
}

export function MissionTimeline({ timeline }: { timeline: ProgramTimeline }) {
  const milestones = buildMilestones(timeline);
  const nextMilestone = milestones.find((m) => !m.passed) ?? milestones[milestones.length - 1];
  const daysToNext = Math.max(0, nextMilestone.day - Math.max(0, timeline.elapsedDays));

  return (
    <div className="mission-timeline">
      <div className="mission-timeline-track">
        <div
          className="mission-timeline-fill"
          style={{ width: `${timeline.percentElapsed * 100}%` }}
        />
        {milestones.map((m) => (
          <div
            key={m.day}
            className={`mission-tick${m.passed ? " is-passed" : ""}${m.isFinal ? " is-final" : ""}`}
            style={{ left: `${Math.min(100, (m.day / timeline.totalDays) * 100)}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="mission-tick-labels" aria-hidden="true">
        {milestones.map((m) => (
          <span
            key={m.day}
            className={`mission-tick-label${m.passed ? " is-passed" : ""}`}
            style={{ left: `${Math.min(100, (m.day / timeline.totalDays) * 100)}%` }}
          >
            {m.isFinal ? "Summit" : `Day ${m.day}`}
          </span>
        ))}
      </div>

      {/* Stat plate: a dark lacquer plaque with a gold frame, bold display-
          face day count up front , a Hunter-License-style stat card rather
          than thin caption text floating directly on the busy paper grain,
          which was unreadable. */}
      <div className="mission-stat-plate">
        <div className="mission-stat-headline">
          <span className="mission-stat-day">Day {Math.max(0, timeline.elapsedDays)}</span>
          <span className="mission-stat-of">of {timeline.totalDays}</span>
        </div>
        <p className="mission-timeline-caption">
          started {formatShortDate(timeline.startedOn)}
          {" · "}
          {timeline.remainingDays > 0
            ? `${timeline.remainingDays} days to Fortissimo Summit`
            : "past the target date, worth a real check-in"}
        </p>
        <p className="mission-quote">
          {daysToNext > 0
            ? `${daysToNext} day${daysToNext === 1 ? "" : "s"} to your next milestone (${nextMilestone.isFinal ? "the Summit" : `Day ${nextMilestone.day}`}): `
            : "You just reached a milestone: "}
          <span className="mission-quote-text">&ldquo;{nextMilestone.quote}&rdquo;</span>
        </p>
      </div>
    </div>
  );
}
