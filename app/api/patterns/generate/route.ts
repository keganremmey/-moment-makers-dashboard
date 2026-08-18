import { NextResponse } from "next/server";
import { getClientByToken, getSessions, getJournalEntries } from "@/lib/data";
import { analyzePatterns } from "@/lib/patterns";
import {
  persistAnalysis,
  getLatestPatternRun,
  countEvidence,
} from "@/lib/patterns-store";

export const maxDuration = 300;

/**
 * Generate patterns and store them. This is the only place a model call
 * happens for patterns; the page itself never waits on one.
 *
 * Incremental by default: if no new evidence has landed since the last run,
 * it does nothing and says so. Pass `force: true` to recompute anyway.
 *
 * Intended callers are the daily job and an explicit refresh, not page loads.
 */
export async function POST(req: Request) {
  let body: { token?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { token, force } = body;
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const client = await getClientByToken(token);
  if (!client) {
    return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  }

  const evidenceCount = await countEvidence(client.id);
  if (evidenceCount < 2) {
    return NextResponse.json({
      ran: false,
      reason: "Needs at least two pieces of evidence.",
      evidenceCount,
    });
  }

  const lastRun = await getLatestPatternRun(client.id);
  if (!force && lastRun && lastRun.evidence_count >= evidenceCount) {
    return NextResponse.json({
      ran: false,
      reason: "No new sessions or journal entries since the last run.",
      evidenceCount,
      lastRanAt: lastRun.ran_at,
    });
  }

  const [sessions, journalEntries] = await Promise.all([
    getSessions(client.id),
    getJournalEntries(client.id),
  ]);

  try {
    const analysis = await analyzePatterns(
      client.name,
      sessions.filter((s) => s.summary_md),
      journalEntries.filter((e) => e.transcript)
    );
    const { written, superseded } = await persistAnalysis(
      client.id,
      analysis,
      evidenceCount
    );
    return NextResponse.json({ ran: true, written, superseded, evidenceCount });
  } catch (err) {
    console.error("Pattern generation failed", err);
    return NextResponse.json(
      { error: "Pattern generation failed." },
      { status: 500 }
    );
  }
}
