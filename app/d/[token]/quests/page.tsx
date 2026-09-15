import { notFound } from "next/navigation";
import {
  getClientByToken,
  getCurrentQuest,
  getQuestEncounters,
  getQuestLogs,
} from "@/lib/data";
import { computeQuestState } from "@/lib/quest";
import { formatShortDate } from "@/lib/timeline";
import { QuestLogForm } from "@/components/QuestLogForm";

export default async function QuestsPage(props: PageProps<"/d/[token]/quests">) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const quest = await getCurrentQuest(client.id);

  if (!quest) {
    return (
      <div className="card p-5">
        <p className="label">Quests</p>
        <p className="mt-3 text-base text-ink-dim">
          No quest running right now. One shows up here the moment Kegan builds it.
        </p>
      </div>
    );
  }

  const [encounters, logs] = await Promise.all([
    getQuestEncounters(quest.id),
    getQuestLogs(quest.id),
  ]);

  const state = computeQuestState(quest, logs);
  const encounterById = new Map(encounters.map((e) => [e.id, e]));
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysLog = logs.find((l) => l.log_date === todayStr) ?? null;
  const sortedLogs = [...logs].sort((a, b) => (a.log_date < b.log_date ? 1 : -1));

  const overRun = quest.status === "active" && state.bossWon;
  const cleared = quest.status === "cleared" || (quest.status === "active" && !overRun && state.killed);

  const statusLabel = cleared
    ? "Boss cleared"
    : overRun
      ? "Boss won this round"
      : state.bossHit
        ? "Boss landed a hit"
        : "Boss still asleep";
  const statusClass = cleared ? "is-cleared" : overRun ? "is-won" : state.bossHit ? "is-hit" : "is-safe";
  const fillClass = overRun ? "is-won" : state.bossHit ? "is-hit" : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="quest-boss-card">
        <p className="quest-boss-label">{quest.name}{quest.subtitle ? ` · ${quest.subtitle}` : ""}</p>
        <h1 className="quest-boss-name">{quest.boss_name}</h1>
        {quest.boss_client_label && (
          <p className="mt-0.5 text-sm text-gold">Known to you as: {quest.boss_client_label}</p>
        )}
        {quest.boss_description && <p className="quest-boss-desc">{quest.boss_description}</p>}

        <div className="quest-progress-track">
          <div
            className="quest-progress-threshold"
            style={{ left: `${Math.min(100, (quest.kill_days / quest.total_days) * 100)}%` }}
            aria-hidden="true"
          />
          <div
            className={`quest-progress-fill${fillClass ? ` ${fillClass}` : ""}`}
            style={{ width: `${Math.min(100, (state.daysLogged / quest.total_days) * 100)}%` }}
          />
        </div>
        <div className="quest-progress-caption">
          <span>{state.daysLogged} of {quest.total_days} days evidenced</span>
          <span>{quest.kill_days} kills the boss</span>
        </div>

        <span className={`quest-status-pill ${statusClass}`}>{statusLabel}</span>

        <p className="mt-3 text-xs" style={{ color: "rgba(247, 242, 230, 0.55)" }}>
          {formatShortDate(quest.window_start)} &ndash; {formatShortDate(quest.window_end)}
          {" · "}Day {Math.min(state.elapsedDays, quest.total_days)} of {quest.total_days}
        </p>
      </div>

      {quest.failsafe && (
        <div className="card p-5">
          <p className="label">Failsafe</p>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-ink-dim">{quest.failsafe}</p>
        </div>
      )}

      <div>
        <p className="label mb-3">The encounters</p>
        <div className="flex flex-col gap-3">
          {encounters.map((e) => (
            <article key={e.id} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="quest-encounter-badge">{String(e.ord).padStart(2, "0")}</span>
                <div>
                  <h2 className="font-display text-lg text-ink">{e.name}</h2>
                  <p className="label mt-0.5">{e.block}</p>
                </div>
              </div>
              <p className="mt-3 text-base leading-relaxed text-ink">{e.objective}</p>
              {e.why && <p className="mt-2 text-sm leading-relaxed text-ink-dim">{e.why}</p>}
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                {e.terrain && (
                  <div>
                    <dt className="label">Terrain</dt>
                    <dd className="mt-0.5 text-ink-dim">{e.terrain}</dd>
                  </div>
                )}
                {e.gear && (
                  <div>
                    <dt className="label">Gear</dt>
                    <dd className="mt-0.5 text-ink-dim">{e.gear}</dd>
                  </div>
                )}
                <div>
                  <dt className="label">Proof</dt>
                  <dd className="mt-0.5 text-ink-dim">{e.proof}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>

      {quest.treasure && (
        <div className="card p-5 border-l-4 border-l-gold">
          <p className="label">Treasure</p>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-ink-dim">{quest.treasure}</p>
        </div>
      )}

      <QuestLogForm token={token} questId={quest.id} encounters={encounters} todaysLog={todaysLog} />

      {sortedLogs.length > 0 && (
        <div>
          <p className="label mb-3">Logged so far</p>
          <div className="flex flex-col gap-2">
            {sortedLogs.map((log) => {
              const encounter = log.encounter_id ? encounterById.get(log.encounter_id) : undefined;
              return (
                <div key={log.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="label">{formatShortDate(log.log_date)}</p>
                    <p className="font-mono text-sm text-gold">{log.score}/4</p>
                  </div>
                  {encounter && <p className="mt-1 font-display text-base text-ink">{encounter.name}</p>}
                  {log.note && <p className="mt-1 text-sm leading-relaxed text-ink-dim">{log.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
