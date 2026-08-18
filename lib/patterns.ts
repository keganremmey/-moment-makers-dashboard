import Anthropic from "@anthropic-ai/sdk";
import type { Session, JournalEntry } from "@/lib/data";

export type PatternTheme = {
  title: string;
  description: string;
  firstSeen: string;
  lastSeen: string;
  sessionCount: number;
  forwardInvitation: string;
};

export type PatternAnalysis = {
  themes: PatternTheme[];
  draftMessage: string;
};

let cachedClient: Anthropic | null = null;

function anthropicClient(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          first_seen: { type: "string", description: "ISO date (YYYY-MM-DD) of the earliest session or journal entry where this pattern is evidenced" },
          last_seen: { type: "string", description: "ISO date (YYYY-MM-DD) of the most recent session or journal entry where this pattern is evidenced" },
          session_count: { type: "integer", description: "How many of the provided sessions and journal entries together show real evidence of this pattern" },
          forward_invitation: { type: "string", description: "A short feedforward-style question or small experiment for next time, not a description of the past" },
        },
        required: ["title", "description", "first_seen", "last_seen", "session_count", "forward_invitation"],
        additionalProperties: false,
      },
    },
    draft_message: { type: "string" },
  },
  required: ["themes", "draft_message"],
  additionalProperties: false,
} as const;

// Prompt methodology grounded in named coaching techniques (researched via
// Perplexity, not invented): Marshall Goldsmith's "feedforward" (talk about
// the future, not a verdict on the past), the ICF competency of evoking
// awareness through tentative, behavioral observation rather than identity-
// based diagnosis, and Michael Bungay Stanier's practice of closing on a
// client-owned next step rather than a coached monologue. The four-part
// structure below (pattern, evidence, dates, forward invitation) mirrors
// the "pattern -> evidence -> future invitation -> client commitment"
// template that research converged on.
const SYSTEM_PROMPT = `You are a coaching-practice assistant. You read a client's real coaching session summaries and self-recorded journal entries, and surface genuine recurring patterns, grounded in the specific evidence-based coaching methodology below. No generic coaching platitudes.

The evidence comes from two sources. Sessions are coach-observed summaries written after a live coaching call. Journal entries are the client's own self-recorded voice-note reflections, transcribed, with no coach present. Treat both as legitimate evidence for a pattern, but keep the distinction clear when it matters: a journal entry tells you what the client noticed or felt on their own, a session tells you what came up with the coach.

Method (draw on these named techniques):
- Feedforward, not feedback (Marshall Goldsmith). Phrase each pattern so it points at what to try next, not a verdict on what went wrong. Never write "you always" or "you failed to." Write toward the next session.
- Tentative, behavioral language, not identity-based diagnosis (ICF core competencies). "There's a pattern where..." not "You are someone who...". Describe what happened, not who the client is.
- Evidence over assertion. A pattern must be traceable to at least two real sessions or journal entries, in any combination. If you can't point to two, it isn't a pattern yet. Leave it out.
- Close on an invitation, not a description (Michael Bungay Stanier). Every pattern ends with a short, concrete, client-choosable next experiment or question for the next session, never just a summary of the past.

For every theme, report exactly which sessions and journal entries evidence it (first_seen / last_seen dates, and how many show it) so the coach can see this is dated and earned, not vibes.

Formatting rule, strict: never use an em dash anywhere in your output, in any field. Use a period, comma, colon, or parentheses instead. Write in plain, direct sentences.`;

// Sessions come in already ordered by real, verified summaries (Fathom
// webhook writes `summary_md` straight from the call transcript). This is
// the one place in the app where we hand real client data to an LLM, so the
// prompt is explicit about grounding every theme in the actual text rather
// than inventing generic coaching language.
//
// journalEntries must already be filtered to non-null transcripts by the
// caller, this function does not filter , it only merges and orders.
export async function analyzePatterns(
  clientName: string,
  sessions: Session[],
  journalEntries: JournalEntry[]
): Promise<PatternAnalysis> {
  const client = anthropicClient();

  const sortedSessions = sessions.slice().sort((a, b) => a.date.localeCompare(b.date));
  const sessionItems = sortedSessions.map((s, i) => {
    const header = `Session ${i + 1} (${s.date})${s.purpose ? `, ${s.purpose}` : ""}`;
    return { date: s.date, text: s.summary_md ? `${header}\n${s.summary_md}` : header };
  });

  const journalItems = journalEntries.map((entry) => {
    const date = entry.created_at.slice(0, 10);
    return { date, text: `Journal entry (self-recorded, ${date})\n${entry.transcript ?? ""}` };
  });

  const transcript = [...sessionItems, ...journalItems]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => item.text)
    .join("\n\n---\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    // 4096 truncated mid-JSON once the evidence set passed ~20 items: with
    // adaptive thinking the reasoning shares this budget, so the structured
    // output got cut and JSON.parse threw. Raised with real headroom.
    max_tokens: 16384,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here are ${clientName}'s coaching session summaries and self-recorded journal entries, oldest first, each dated:\n\n${transcript}\n\nTwo things:\n\n1. Identify 2-4 real recurring themes across these sessions and journal entries, following the method above. For each: a short title, a 1-3 sentence description in feedforward/behavioral language, the exact first_seen and last_seen dates, session_count (how many sessions and journal entries together actually evidence it), and a forward_invitation, one concrete, small, client-choosable question or experiment for next time.\n\n2. Draft a short check-in text or email from the coach to ${clientName}, in a warm, direct, non-generic voice. Like a text from someone who's actually been paying attention, not a corporate check-in. Reference one specific, real, dated thing from these sessions or journal entries. Keep it under 80 words. Close with a feedforward-style invitation (an experiment or a question about next time), not "let me know if you need anything." Do not use an em dash anywhere in this message.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content.");
  }

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Pattern analysis hit the token ceiling before finishing its JSON. Raise max_tokens or reduce the evidence window."
    );
  }

  const parsed = JSON.parse(textBlock.text) as {
    themes: {
      title: string;
      description: string;
      first_seen: string;
      last_seen: string;
      session_count: number;
      forward_invitation: string;
    }[];
    draft_message: string;
  };

  return {
    themes: parsed.themes.map((t) => ({
      title: t.title,
      description: t.description,
      firstSeen: t.first_seen,
      lastSeen: t.last_seen,
      sessionCount: t.session_count,
      forwardInvitation: t.forward_invitation,
    })),
    draftMessage: parsed.draft_message,
  };
}
