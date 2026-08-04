// Belt/level thresholds for the skill rep-tracking system.
// This is coaching methodology (constant across all clients), not
// per-client data, so it lives in code rather than a database table.
// Sourced from seed/ian-lynch.json -> belt_thresholds.

export type Belt = {
  name: string;
  minReps: number;
};

export const BELTS: Belt[] = [
  { name: "White", minReps: 0 },
  { name: "Gray", minReps: 10 },
  { name: "Blue", minReps: 20 },
  { name: "Purple", minReps: 35 },
  { name: "Brown", minReps: 55 },
  { name: "Black", minReps: 80 },
];

export type BeltStatus = {
  belt: Belt;
  nextBelt: Belt | null;
  reps: number;
  repsToNext: number | null;
};

/** Given a cumulative rep count, return the current belt, the next belt
 * (or null if already at the top), and reps remaining to reach it. */
export function beltStatusForReps(reps: number): BeltStatus {
  let current = BELTS[0];
  let next: Belt | null = null;

  for (let i = 0; i < BELTS.length; i++) {
    if (reps >= BELTS[i].minReps) {
      current = BELTS[i];
      next = BELTS[i + 1] ?? null;
    }
  }

  return {
    belt: current,
    nextBelt: next,
    reps,
    repsToNext: next ? next.minReps - reps : null,
  };
}
