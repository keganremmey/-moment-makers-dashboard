// Quest state: pure date math over a quest's window and its logged days, no
// side effects , mirrors lib/timeline.ts's split between "real data in" and
// "derived state out". A quest lives or dies on two independent rules (a
// count threshold to win, a consecutive-miss streak to lose), so both are
// computed here rather than inline in a component, where they'd be easy to
// get subtly wrong twice.

import type { Quest, QuestLog } from "@/lib/data";

export type QuestState = {
  elapsedDays: number;
  totalDays: number;
  daysLogged: number;
  killDays: number;
  daysRemaining: number;
  currentMissStreak: number;
  bossHit: boolean;
  bossWon: boolean;
  killed: boolean;
  loggedDates: Set<string>;
};

function toUtcDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function computeQuestState(
  quest: Quest,
  logs: QuestLog[],
  today: Date = new Date()
): QuestState {
  const windowStart = toUtcDate(quest.window_start);
  const windowEnd = toUtcDate(quest.window_end);
  const now = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const effectiveToday = now < windowStart ? windowStart : now > windowEnd ? windowEnd : now;
  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsedDays =
    now < windowStart ? 0 : Math.floor((effectiveToday.getTime() - windowStart.getTime()) / msPerDay) + 1;

  const loggedDates = new Set(logs.map((l) => l.log_date));
  const daysLogged = loggedDates.size;
  const daysRemaining = Math.max(0, quest.total_days - elapsedDays);

  // Walk backward from the most recent elapsed day, counting the unbroken
  // run of missed days right up to now , a miss from a week ago that was
  // later logged around doesn't count, only the live streak does.
  let currentMissStreak = 0;
  if (now >= windowStart) {
    for (let d = effectiveToday; d >= windowStart; d = addDays(d, -1)) {
      if (loggedDates.has(toDateStr(d))) break;
      currentMissStreak += 1;
    }
  }

  return {
    elapsedDays,
    totalDays: quest.total_days,
    daysLogged,
    killDays: quest.kill_days,
    daysRemaining,
    currentMissStreak,
    bossHit: currentMissStreak >= 2,
    bossWon: currentMissStreak >= 3,
    killed: daysLogged >= quest.kill_days,
    loggedDates,
  };
}
