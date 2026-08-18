// The mission timeline: real elapsed time toward a client's stated
// deadline, not a generic "24 sessions" package label. Pure date math,
// no side effects , the caller supplies "started" (a client's earliest
// real session date) and "target" (client.target_date), both of which
// come from real data, never invented here.

export type ProgramTimeline = {
  startedOn: string;
  targetOn: string;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  percentElapsed: number; // 0–1, clamped
};

export function computeProgramTimeline(
  startedOn: string,
  targetOn: string,
  today: Date = new Date()
): ProgramTimeline {
  const start = new Date(startedOn + "T00:00:00Z");
  const target = new Date(targetOn + "T00:00:00Z");
  const now = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((target.getTime() - start.getTime()) / msPerDay));
  const elapsedDays = Math.round((now.getTime() - start.getTime()) / msPerDay);
  const remainingDays = Math.round((target.getTime() - now.getTime()) / msPerDay);
  const percentElapsed = Math.min(1, Math.max(0, elapsedDays / totalDays));

  return { startedOn, targetOn, totalDays, elapsedDays, remainingDays, percentElapsed };
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
