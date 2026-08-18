import { notFound } from "next/navigation";
import { getClientByToken, getSessions, getJournalEntries } from "@/lib/data";
import { analyzePatterns } from "@/lib/patterns";
import { PatternDraftMessage } from "@/components/PatternDraftMessage";

export default async function PatternsPage(
  props: PageProps<"/d/[token]/patterns">
) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const [sessions, journalEntries] = await Promise.all([
    getSessions(client.id),
    getJournalEntries(client.id),
  ]);
  const sessionsWithSummaries = sessions.filter((s) => s.summary_md);
  const journalEntriesWithTranscripts = journalEntries.filter((e) => e.transcript);

  const evidenceCount = sessionsWithSummaries.length + journalEntriesWithTranscripts.length;

  if (evidenceCount < 2) {
    return (
      <div className="card p-5">
        <p className="label">Patterns</p>
        <p className="mt-2 text-base text-ink-dim">
          Patterns need at least two logged sessions with notes, or journal
          entries, to compare. Check back after a few more.
        </p>
      </div>
    );
  }

  let analysis;
  let errorMessage: string | null = null;
  try {
    analysis = await analyzePatterns(
      client.name,
      sessionsWithSummaries,
      journalEntriesWithTranscripts
    );
  } catch (err) {
    console.error("Pattern analysis failed", err);
    errorMessage =
      err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
        ? "Pattern analysis isn't configured yet. Add ANTHROPIC_API_KEY to the environment to enable this tab."
        : "Pattern analysis couldn't run right now. Try again in a moment.";
  }

  if (errorMessage || !analysis) {
    return (
      <div className="card p-5">
        <p className="label">Patterns</p>
        <p className="mt-2 text-base text-ink-dim">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="label">Cross-session patterns</p>
        <p className="mt-1 text-sm text-ink-dim">
          Pulled from {sessionsWithSummaries.length} logged session
          {sessionsWithSummaries.length === 1 ? "" : "s"} and{" "}
          {journalEntriesWithTranscripts.length} journal entr
          {journalEntriesWithTranscripts.length === 1 ? "y" : "ies"}.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {analysis.themes.map((theme, i) => (
          <article key={i} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="font-display text-lg text-ink">{theme.title}</h3>
              <p className="label">
                {theme.firstSeen === theme.lastSeen
                  ? theme.firstSeen
                  : `${theme.firstSeen} → ${theme.lastSeen}`}
                {" · "}
                {theme.sessionCount} session{theme.sessionCount === 1 ? "" : "s"}
              </p>
            </div>
            <p className="mt-2 text-base leading-relaxed text-ink-dim">
              {theme.description}
            </p>
            <p className="mt-3 border-t border-paper-line pt-3 text-sm text-ink">
              <span className="text-gold">Try next: </span>
              {theme.forwardInvitation}
            </p>
          </article>
        ))}
      </div>

      <div className="card p-5">
        <p className="label">Draft check-in</p>
        <p className="mt-1 text-sm text-ink-dim">
          Review and edit before sending. This is a starting point, not a
          final message.
        </p>
        <PatternDraftMessage text={analysis.draftMessage} />
      </div>
    </div>
  );
}
