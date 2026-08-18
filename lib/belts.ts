// Belt/level thresholds for the skill rep-tracking system.
// This is coaching methodology (constant across all clients), not
// per-client data, so it lives in code rather than a database table.
// Sourced from seed/ian-lynch.json -> belt_thresholds.

export type Belt = {
  name: string;
  minReps: number;
  description: string;
};

// Descriptions are this app's own authored mastery curve (same status as the
// rep thresholds themselves , a designed game layer, not a transcript quote)
// so a client can see what a rank actually represents, not just its number.
export const BELTS: Belt[] = [
  { name: "White", minReps: 0, description: "First reps. Building awareness of the pattern in real time." },
  { name: "Gray", minReps: 10, description: "Catching it before it happens. Consistent under low stakes." },
  { name: "Blue", minReps: 20, description: "Reliable under real pressure, not just in easy moments." },
  { name: "Purple", minReps: 35, description: "Second nature in most rooms, barely has to think about it." },
  { name: "Brown", minReps: 55, description: "Sharp enough to adjust it live, mid-conversation." },
  { name: "Black", minReps: 80, description: "Teaches it without trying. It just shows up as who you are." },
];

// Shared rank -> color map, consumed by both BeltChip (per-skill status
// chip) and BeltLadder (the full roadmap reference), so the two visuals can
// never drift out of sync on what a rank's color is.
export const BELT_COLORS: Record<string, string> = {
  White: "var(--belt-white)",
  Gray: "var(--belt-gray)",
  Blue: "var(--belt-blue)",
  Purple: "var(--belt-purple)",
  Brown: "var(--belt-brown)",
  Black: "var(--belt-black)",
};

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
