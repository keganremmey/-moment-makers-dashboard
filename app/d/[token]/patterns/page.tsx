import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/data";
import {
  getStoredPatterns,
  getLatestPatternRun,
  countEvidence,
} from "@/lib/patterns-store";
import { PatternDraftMessage } from "@/components/PatternDraftMessage";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toISOString().slice(0, 10);
}

/**
 * Patterns are read, not computed. Every theme here was written by a prior
 * generation run and lives in the `patterns` table, so this page is a plain
 * indexed select with no model call and no waiting.
 */
export default async function PatternsPage(
  props: PageProps<"/d/[token]/patterns">
) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const [patterns, lastRun, evidenceCount] = await Promise.all([
    getStoredPatterns(client.id),
    getLatestPatternRun(client.id),
    countEvidence(client.id),
  ]);

  if (patterns.length === 0) {
    return (
      <div className="card p-5">
        <p className="label">Patterns</p>
        <p className="mt-2 text-base text-ink-dim">
          {evidenceCount < 2
            ? "Patterns need at least two logged sessions with notes, or journal entries, to compare. Check back after a few more."
            : "No patterns documented yet. The next daily run will read the sessions on file and write them here."}
        </p>
      </div>
    );
  }

  const hasNewEvidence = lastRun ? evidenceCount > lastRun.evidence_count : false;

  return (
    <div className="flex flex-col gap-4">
      {patterns.map((p) => (
        <section key={p.id} className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-display text-xl uppercase tracking-tight leading-none text-ink">
              {p.title}
            </h2>
            {p.first_seen && p.last_seen && (
              <p className="text-xs text-ink-dim">
                {p.first_seen} to {p.last_seen} · {p.session_count} showing it
              </p>
            )}
          </div>

          {p.description && (
            <p className="mt-3 text-base leading-relaxed text-ink">{p.description}</p>
          )}

          {p.forward_invitation && (
            <div className="mt-4 border-l-4 border-l-gold pl-4">
              <p className="label">Try next</p>
              <p className="mt-1 text-base leading-relaxed text-ink">
                {p.forward_invitation}
              </p>
            </div>
          )}
        </section>
      ))}

      {lastRun?.draft_message && (
        <PatternDraftMessage text={lastRun.draft_message} />
      )}

      {lastRun && (
        <p className="text-xs text-ink-dim">
          Documented {formatWhen(lastRun.ran_at)} from {lastRun.evidence_count}{" "}
          sessions and journal entries.
          {hasNewEvidence &&
            ` ${evidenceCount - lastRun.evidence_count} newer since then, included in the next run.`}
        </p>
      )}
    </div>
  );
}
