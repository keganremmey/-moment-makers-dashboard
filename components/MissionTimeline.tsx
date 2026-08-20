import { formatShortDate, type ProgramTimeline } from "@/lib/timeline";
import { CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr";

const MISSION_QUOTE = "Be the butler of your future self.";

type Milestone = {
  day: number;
  dateStr: string;
  passed: boolean;
  isFinal: boolean;
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

  return days.map((day) => ({
    day,
    dateStr: addDays(timeline.startedOn, day),
    passed: timeline.elapsedDays >= day,
    isFinal: day === timeline.totalDays,
  }));
}

export function MissionTimeline({
  timeline,
  totalReps,
}: {
  timeline: ProgramTimeline;
  totalReps: number;
}) {
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
            className="mission-checkpoint"
            style={{ left: `${Math.min(100, (m.day / timeline.totalDays) * 100)}%` }}
            aria-hidden="true"
          >
            {m.passed ? (
              <CheckCircle
                weight="fill"
                size={m.isFinal ? 20 : 14}
                className="mission-checkpoint-icon is-passed"
              />
            ) : (
              <Circle
                weight="bold"
                size={m.isFinal ? 18 : 12}
                className="mission-checkpoint-icon"
              />
            )}
          </div>
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

      {/* Stat plate: a dark lacquer plaque with a gold frame. The headline
          number is reps logged, not elapsed days , what he actually built,
          not what the calendar produced for free. Day count still lives
          here, just demoted to the caption line below it. */}
      <div className="mission-stat-plate">
        <div className="mission-stat-headline">
          <span className="mission-stat-day">{totalReps}</span>
          <span className="mission-stat-of">rep{totalReps === 1 ? "" : "s"} logged</span>
        </div>
        <p className="mission-timeline-caption">
          Day {Math.max(0, timeline.elapsedDays)} of {timeline.totalDays}
          {" · "}
          {timeline.remainingDays > 0
            ? `${timeline.remainingDays} days to Fortissimo Summit`
            : "past the target date, worth a real check-in"}
        </p>
        <p className="mission-quote">
          {daysToNext > 0
            ? `${daysToNext} day${daysToNext === 1 ? "" : "s"} to your next checkpoint (${nextMilestone.isFinal ? "the Summit" : `Day ${nextMilestone.day}`}): `
            : "You just cleared a checkpoint: "}
          <span className="mission-quote-text">&ldquo;{MISSION_QUOTE}&rdquo;</span>
        </p>
      </div>
    </div>
  );
}
