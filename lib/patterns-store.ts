import { supabaseServer } from "@/lib/supabase-server";
import type { PatternAnalysis } from "@/lib/patterns";

export type StoredPattern = {
  id: string;
  title: string;
  description: string | null;
  forward_invitation: string | null;
  first_seen: string | null;
  last_seen: string | null;
  session_count: number;
  evidence_count: number;
  status: string;
  updated_at: string;
};

export type PatternRun = {
  ran_at: string;
  status: string;
  draft_message: string | null;
  evidence_count: number;
};

/**
 * Read the documented patterns. This is what the page renders, and it is a
 * plain indexed select: no model call, no countdown, no waiting.
 */
export async function getStoredPatterns(clientId: string): Promise<StoredPattern[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("patterns")
    .select(
      "id,title,description,forward_invitation,first_seen,last_seen,session_count,evidence_count,status,updated_at"
    )
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("last_seen", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as StoredPattern[];
}

export async function getLatestPatternRun(clientId: string): Promise<PatternRun | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("pattern_runs")
    .select("ran_at,status,draft_message,evidence_count")
    .eq("client_id", clientId)
    .order("ran_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as PatternRun | null;
}

/**
 * How much evidence exists right now, versus how much the last run consumed.
 * This is what makes generation incremental: a run is only worth doing when
 * new material has landed since the last one.
 */
export async function countEvidence(clientId: string): Promise<number> {
  const supabase = supabaseServer();
  const [{ count: sessionCount }, { count: journalCount }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .not("summary_md", "is", null),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .not("transcript", "is", null),
  ]);
  return (sessionCount ?? 0) + (journalCount ?? 0);
}

/**
 * Write an analysis into the store.
 *
 * Titles are the identity key. A theme that comes back with the same title is
 * updated in place with the newer window; a theme that has genuinely changed
 * shape gets a new row and the old one is marked superseded rather than
 * deleted, so the history of what was once true about this client survives.
 */
export async function persistAnalysis(
  clientId: string,
  analysis: PatternAnalysis,
  evidenceCount: number
): Promise<{ written: number; superseded: number }> {
  const supabase = supabaseServer();

  const { data: existingRows } = await supabase
    .from("patterns")
    .select("id,title")
    .eq("client_id", clientId)
    .eq("status", "active");

  // Same `as never` mutation cast the rest of this app uses (see
  // app/api/tasks/[id]/toggle/route.ts): the Supabase client is untyped here,
  // so writes need the cast and reads need a shape assertion.
  const existing = new Map(
    ((existingRows ?? []) as { id: string; title: string }[]).map((r) => [r.title, r.id])
  );
  const incomingTitles = new Set(analysis.themes.map((t) => t.title));

  let written = 0;
  for (const theme of analysis.themes) {
    const row = {
      client_id: clientId,
      title: theme.title,
      description: theme.description,
      forward_invitation: theme.forwardInvitation,
      first_seen: theme.firstSeen || null,
      last_seen: theme.lastSeen || null,
      session_count: theme.sessionCount ?? 0,
      evidence_count: evidenceCount,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    const priorId = existing.get(theme.title);
    if (priorId) {
      await supabase.from("patterns").update(row as never).eq("id", priorId);
    } else {
      await supabase.from("patterns").insert(row as never);
    }
    written += 1;
  }

  // A previously active theme the latest pass no longer supports is archived,
  // never deleted. It stopped being evidenced; it still happened.
  let superseded = 0;
  for (const [title, id] of existing) {
    if (!incomingTitles.has(title)) {
      await supabase
        .from("patterns")
        .update({ status: "archived", updated_at: new Date().toISOString() } as never)
        .eq("id", id);
      superseded += 1;
    }
  }

  await supabase.from("pattern_runs").insert({
    client_id: clientId,
    status: "ok",
    draft_message: analysis.draftMessage,
    themes_written: written,
    themes_superseded: superseded,
    evidence_count: evidenceCount,
  } as never);

  return { written, superseded };
}
