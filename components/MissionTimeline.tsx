import { formatShortDate, getCheckpointDays, type ProgramTimeline } from "@/lib/timeline";

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

function buildMilestones(timeline: ProgramTimeline): Milestone[] {
  return getCheckpointDays(timeline.totalDays).map((day) => ({
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
        {milestones.map((m) => {
          const size = m.isFinal ? 20 : 14;
          return (
            <div
              key={m.day}
              className="mission-checkpoint"
              style={{ left: `${Math.min(100, (m.day / timeline.totalDays) * 100)}%` }}
              aria-hidden="true"
            >
              {m.passed ? (
                <svg width={size} height={size} viewBox="0 0 20 20" className="mission-checkpoint-icon is-passed">
                  <circle cx="10" cy="10" r="9" fill="currentColor" />
                  <path d="M6 10.2 8.7 13 14 7" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width={size} height={size} viewBox="0 0 20 20" className="mission-checkpoint-icon">
                  <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </div>
          );
        })}
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
