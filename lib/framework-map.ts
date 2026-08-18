// Presentation-layer structure for the Library "terrain map" , how the
// frameworks fetched from Supabase relate to each other spatially and
// sequentially. This is coaching methodology (grouping + wayfinding),
// not client data, so it lives in code rather than a database table ,
// same reasoning as lib/belts.ts for belt thresholds.
//
// Non-hierarchical among the six ground-level regions: no stuck-state
// terrain feature here is "worse" than another. Routes mean "if you're
// here, use this to get there," not "this comes before that" , except
// that every route in the graph eventually climbs toward Fortissimo
// Summit, the one shared destination.

export const TERRITORIES = [
  { id: "swamp", name: "Waffle Swamp", blurb: "For when you keep explaining the explanation instead of just landing the point." },
  { id: "fog", name: "Self-Doubt Fog", blurb: "For when the voice in your head won't let the honest thing out." },
  { id: "frozen-lake", name: "Lonely Lake", blurb: "For when you freeze up and don't know what to say next." },
  { id: "valley", name: "The Shrinking Valley", blurb: "For when your real want gets talked down to something ‘reasonable.’" },
  { id: "flatlands", name: "The Flatlands", blurb: "For when you tell the story but it never actually lands." },
  { id: "crossroads", name: "The Crossroads", blurb: "For when you're waiting on the room to give you permission." },
  { id: "summit", name: "Fortissimo Summit", blurb: "Where the ask finally lands, clean, direct, no apology." },
] as const;

export const FRAMEWORK_TERRITORY: Record<string, typeof TERRITORIES[number]["id"]> = {
  "interrupt-switch": "swamp",
  "context-point-silence": "swamp",
  "observational-labels": "swamp",
  "host-interrupt": "swamp",
  "externalizing-the-critic": "fog",
  "radical-honesty": "fog",
  "box-checker-vs-savorer": "frozen-lake",
  "4r-method": "frozen-lake",
  "settled-certainty": "frozen-lake",
  "desire-log": "valley",
  "outrageous-asks": "valley",
  "playfulness-spectrum": "valley",
  "star-method": "flatlands",
  "sema-framework": "flatlands",
  "rsi-structure": "flatlands",
  "scanning-vs-settling": "crossroads",
  "dominant-attention": "crossroads",
  "human-design-manifester": "crossroads",
  "3-2-1-pitch": "summit",
};

export const FRAMEWORK_ROUTES: { from: string; to: string; note: string }[] = [
  { from: "desire-log", to: "outrageous-asks", note: "Once naming small wants feels safe, practice naming big ones." },
  { from: "playfulness-spectrum", to: "outrageous-asks", note: "Practicing lightness makes it easier to voice a big want out loud." },
  { from: "outrageous-asks", to: "3-2-1-pitch", note: "Turn a big want into a structured ask." },
  { from: "box-checker-vs-savorer", to: "interrupt-switch", note: "Once you can feel yourself rushing, use this to catch it in real time." },
  { from: "interrupt-switch", to: "context-point-silence", note: "Once you can catch the urge to explain, use this structure to replace it." },
  { from: "host-interrupt", to: "observational-labels", note: "Both tools for holding a room; labels add the mirroring step." },
  { from: "context-point-silence", to: "3-2-1-pitch", note: "The structure that gets you out of the swamp is the same one that lands the ask." },
  { from: "externalizing-the-critic", to: "radical-honesty", note: "Once the critic's voice has distance, speak the truth underneath it." },
  { from: "4r-method", to: "settled-certainty", note: "Once the body is regulated, practice embodying grounded certainty." },
  { from: "settled-certainty", to: "3-2-1-pitch", note: "A grounded state is what makes the ask land instead of wobble." },
  { from: "human-design-manifester", to: "4r-method", note: "From knowing your not-self signal (anger) to a concrete regulation tool." },
  { from: "scanning-vs-settling", to: "dominant-attention", note: "Both about redirecting focus outward." },
  { from: "star-method", to: "sema-framework", note: "From structuring a story to shaping what it makes someone feel." },
  { from: "sema-framework", to: "rsi-structure", note: "From emotional shaping to a full narrative arc." },
];
