import { getSessions, getJournalEntries } from "@/lib/data";
import { analyzePatterns } from "@/lib/patterns";
import {
  persistAnalysis,
  getLatestPatternRun,
  countEvidence,
} from "@/lib/patterns-store";
import { supabaseServer } from "@/lib/supabase-server";

export type RefreshResult =
  | { ran: false; reason: string; evidenceCount: number }
  | { ran: true; written: number; superseded: number; evidenceCount: number };

/**
 * Regenerate a client's documented patterns, but only when there is genuinely
 * something new to read.
 *
 * This is the single entry point for keeping Patterns current. It is called
 * automatically whenever new evidence lands (a Fathom session webhook, a
 * journal upload) and by the manual refresh route. Nothing about it depends
 * on someone opening the Patterns page.
 */
export async function refreshPatterns(
  clientId: string,
  opts: { force?: boolean } = {}
): Promise<RefreshResult> {
  const evidenceCount = await countEvidence(clientId);

  if (evidenceCount < 2) {
    return { ran: false, reason: "needs at least two pieces of evidence", evidenceCount };
  }

  if (!opts.force) {
    const lastRun = await getLatestPatternRun(clientId);
    if (lastRun && lastRun.evidence_count >= evidenceCount) {
      return { ran: false, reason: "no new evidence since last run", evidenceCount };
    }
  }

  const supabase = supabaseServer();
  const { data } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .maybeSingle();
  const clientName = (data as { name?: string } | null)?.name ?? "the client";

  const [sessions, journalEntries] = await Promise.all([
    getSessions(clientId),
    getJournalEntries(clientId),
  ]);

  try {
    const analysis = await analyzePatterns(
      clientName,
      sessions.filter((s) => s.summary_md),
      journalEntries.filter((e) => e.transcript)
    );
    const { written, superseded } = await persistAnalysis(
      clientId,
      analysis,
      evidenceCount
    );
    return { ran: true, written, superseded, evidenceCount };
  } catch (err) {
    // Record the failure so a stale Patterns page is explainable rather than
    // silently old, then rethrow for the caller's logs.
    await supabase.from("pattern_runs").insert({
      client_id: clientId,
      status: "error",
      evidence_count: evidenceCount,
      error_detail: err instanceof Error ? err.message : String(err),
    } as never);
    throw err;
  }
}
