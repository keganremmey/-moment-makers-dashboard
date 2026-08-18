import { timingSafeEqual } from "node:crypto";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { formatShortDate } from "@/lib/timeline";

function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

type ClientStats = {
  id: string;
  name: string;
  createdAt: string;
  repCount: number;
  openTasks: number;
  slippedTasks: number;
  doneTasks: number;
  winCount: number;
  sessionCount: number;
  journalCount: number;
  journalWords: number;
  lastActive: string | null;
};

async function loadStats(): Promise<ClientStats[]> {
  const supabase = supabaseServer();

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, created_at")
    .order("created_at", { ascending: true });
  const clients = (clientsData as { id: string; name: string; created_at: string }[]) ?? [];

  return Promise.all(
    clients.map(async (client) => {
      const [reps, tasks, wins, sessions, journal] = await Promise.all([
        supabase.from("skill_reps").select("date").eq("client_id", client.id),
        supabase.from("tasks").select("status, updated_at").eq("client_id", client.id),
        supabase.from("wins").select("date").eq("client_id", client.id),
        supabase.from("sessions").select("date").eq("client_id", client.id),
        supabase
          .from("journal_entries")
          .select("created_at, word_count")
          .eq("client_id", client.id),
      ]);

      const repRows = (reps.data as { date: string }[]) ?? [];
      const taskRows = (tasks.data as { status: string; updated_at: string }[]) ?? [];
      const winRows = (wins.data as { date: string }[]) ?? [];
      const sessionRows = (sessions.data as { date: string }[]) ?? [];
      const journalRows =
        (journal.data as { created_at: string; word_count: number | null }[]) ?? [];

      const dates = [
        ...repRows.map((r) => r.date),
        ...taskRows.map((t) => t.updated_at),
        ...winRows.map((w) => w.date),
        ...sessionRows.map((s) => s.date),
        ...journalRows.map((j) => j.created_at),
      ].filter(Boolean);
      const lastActive = dates.length > 0 ? dates.sort().at(-1)! : null;

      return {
        id: client.id,
        name: client.name,
        createdAt: client.created_at,
        repCount: repRows.length,
        openTasks: taskRows.filter((t) => t.status === "open").length,
        slippedTasks: taskRows.filter((t) => t.status === "slipped").length,
        doneTasks: taskRows.filter((t) => t.status === "done").length,
        winCount: winRows.length,
        sessionCount: sessionRows.length,
        journalCount: journalRows.length,
        journalWords: journalRows.reduce((sum, j) => sum + (j.word_count ?? 0), 0),
        lastActive,
      };
    })
  );
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export default async function AdminStatsPage(props: PageProps<"/admin/[token]">) {
  const { token } = await props.params;
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;

  if (!adminToken || !tokensMatch(token, adminToken)) {
    notFound();
  }

  const stats = await loadStats();

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="label">Moment Makers</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Beta Stats</h1>
        <p className="mt-2 text-sm text-ink-dim">
          Private view. Not linked anywhere in the client-facing app.
        </p>
      </div>

      {stats.length === 0 && (
        <p className="text-base text-ink-dim">No clients yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {stats.map((s) => {
          const idle = s.lastActive ? daysSince(s.lastActive) : null;
          return (
            <section key={s.id} className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg text-ink">{s.name}</h2>
                <p className="label">
                  {s.lastActive
                    ? idle === 0
                      ? `Active today`
                      : `Last active ${idle} day${idle === 1 ? "" : "s"} ago`
                    : "No activity yet"}
                </p>
              </div>
              <p className="mt-1 text-xs text-ink-dim">
                Registered {formatShortDate(s.createdAt.slice(0, 10))}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="label">Reps</p>
                  <p className="mt-1 font-display text-2xl text-ink">{s.repCount}</p>
                </div>
                <div>
                  <p className="label">Sessions</p>
                  <p className="mt-1 font-display text-2xl text-ink">{s.sessionCount}</p>
                </div>
                <div>
                  <p className="label">Wins</p>
                  <p className="mt-1 font-display text-2xl text-ink">{s.winCount}</p>
                </div>
                <div>
                  <p className="label">Journal</p>
                  <p className="mt-1 font-display text-2xl text-ink">{s.journalCount}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-paper-line pt-3 text-sm text-ink-dim">
                <span>{s.openTasks} open task{s.openTasks === 1 ? "" : "s"}</span>
                {s.slippedTasks > 0 && (
                  <span className="text-lacquer">
                    {s.slippedTasks} slipped
                  </span>
                )}
                <span>{s.doneTasks} done</span>
                {s.journalWords > 0 && (
                  <span>{s.journalWords.toLocaleString()} journal words</span>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
