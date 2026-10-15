// The 4 event-quiz questions, copied verbatim from the live quiz at
// body.wearemomentmakers.com/q/assessment (version "event-v1"). Each answer
// letter maps to one pattern; "read" is the line shown under the answer on
// the results page.
export type Letter = "A" | "B" | "C" | "D";
export type Pattern = "HOLDER" | "DRIVER" | "COMPENSATOR" | "OVERRIDER";

export const LETTERS: Letter[] = ["A", "B", "C", "D"];
export const PATTERN_BY_LETTER: Record<Letter, Pattern> = {
  A: "HOLDER",
  B: "DRIVER",
  C: "COMPENSATOR",
  D: "OVERRIDER",
};

export const QUESTIONS: {
  id: number;
  prompt: string;
  answers: Record<Letter, { text: string; read: string }>;
}[] = [
  {
    id: 1,
    prompt: "You're an hour into a long drive.",
    answers: {
      A: {
        text: "I could not tell you the last time I let go of the wheel with either hand.",
        read: "An hour of driving and your grip never clocked out.",
      },
      B: {
        text: "I've already decided I'm not stopping. Not for food, not for anything.",
        read: "The decision was made before your body got a vote.",
      },
      C: {
        text: "I keep shifting around to get comfortable and I always end up back on the same hip.",
        read: "You went looking for comfort and your body kept handing you the same hip.",
      },
      D: {
        text: "I don't pay attention to my body until the drive is over, then it's oh, that's sore.",
        read: "The drive was over before the information arrived.",
      },
    },
  },
  {
    id: 2,
    prompt: "It's eight at night and nothing is on the calendar.",
    answers: {
      A: {
        text: "I sit down to relax and an hour later I'm still perched on the edge of the seat.",
        read: "You gave yourself the evening and your body stayed on duty for it.",
      },
      B: {
        text: "I'm tired and I find a project anyway. There is always a project.",
        read: "You had the data. Tired. You filed it and found a project.",
      },
      C: {
        text: "I find the one position on the couch that works and I don't move from it.",
        read: "One position works, so one position is the whole couch.",
      },
      D: {
        text: "About twenty minutes in it hits me how wrecked I actually am.",
        read: "Twenty minutes is how long it took the day to reach you.",
      },
    },
  },
  {
    id: 3,
    prompt: "You're carrying the groceries in from the car.",
    answers: {
      A: {
        text: "I set the bags down and my hands stay curled like claws for a second.",
        read: "You put the bags down. Your hands kept carrying them.",
      },
      B: {
        text: "One trip. Always one trip. Going back out for a second load is losing.",
        read: "Two trips was available. You declined.",
      },
      C: {
        text: "Same shoulder, same arm, every single time, and I never decided that.",
        read: "Same shoulder every time, and you never chose it. That is the part worth noticing.",
      },
      D: {
        text: "My arm goes dead about an hour later and I blame something else.",
        read: "An hour later, and you blamed something that had nothing to do with it.",
      },
    },
  },
  {
    id: 4,
    prompt: "You've been at the desk for hours and you finally stand up.",
    answers: {
      A: {
        text: "First thing I do is roll my shoulders and crack my neck before I feel normal again.",
        read: "You need a ritual to get your body back, which means something was being held the whole time.",
      },
      B: {
        text: "I stand up, walk around for ninety seconds, and sit right back down.",
        read: "You took the break, looked at it, and handed it back.",
      },
      C: {
        text: "Whatever's stiff when I stand up, it's the same side it always is.",
        read: "Whatever gets stiff, your body already picked a favorite side to do it on.",
      },
      D: {
        text: "Something hurts and I've got no idea what I did to it.",
        read: "Pain with no story attached. You were not there when it was made.",
      },
    },
  },
];
