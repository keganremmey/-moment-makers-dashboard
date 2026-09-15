"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QuestEncounter, QuestLog } from "@/lib/data";

const SCORES = [0, 1, 2, 3, 4];

/**
 * The app's version of the daily spine: which encounter, a STARA under
 * about 30 seconds spoken (roughly the length of the placeholder text
 * below), and a score out of four. Pre-fills from today's log if one
 * already exists, so re-opening the tab to fix a note edits it in place
 * instead of looking blank.
 */
export function QuestLogForm({
  token,
  questId,
  encounters,
  todaysLog,
}: {
  token: string;
  questId: string;
  encounters: QuestEncounter[];
  todaysLog: QuestLog | null;
}) {
  const router = useRouter();
  const [encounterId, setEncounterId] = useState<string | null>(
    todaysLog?.encounter_id ?? encounters[0]?.id ?? null
  );
  const [note, setNote] = useState(todaysLog?.note ?? "");
  const [score, setScore] = useState<number | null>(todaysLog?.score ?? null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit() {
    if (score === null || isPending) return;
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const res = await fetch("/api/quests/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, questId, encounterId, note, score }),
      });

      if (!res.ok) {
        setError("Couldn't save, try again.");
        return;
      }

      setSaved(true);
      router.refresh();
    });
  }

  return (
    <section className="card p-5">
      <p className="label">{todaysLog ? "Today's log" : "Log today"}</p>

      <div className="mt-3 flex flex-col gap-2">
        {encounters.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEncounterId(e.id)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              encounterId === e.id
                ? "border-gold bg-paper-raised"
                : "border-paper-line bg-transparent hover:bg-paper-raised"
            }`}
          >
            <span className="quest-encounter-badge">{String(e.ord).padStart(2, "0")}</span>
            <span>
              <span className="block font-display text-base text-ink">{e.name}</span>
              <span className="block text-xs text-ink-dim">{e.block}</span>
            </span>
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="label">STARA, under 30 seconds</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Situation, tension, action, result, aftermath. Say what happened, not the whole story."
          rows={3}
          maxLength={1000}
          className="mt-2 w-full rounded-lg border border-paper-line bg-paper-raised px-4 py-2.5 text-base text-ink placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-paper"
        />
      </label>

      <div className="mt-4">
        <span className="label">Score out of four</span>
        <div className="mt-2 flex gap-2">
          {SCORES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScore(s)}
              aria-pressed={score === s}
              className={`quest-score-btn${score === s ? " is-selected" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={score === null || isPending}
        className="btn btn-primary mt-4"
      >
        {isPending ? "Saving..." : todaysLog ? "Update today's log" : "Log today"}
      </button>

      {saved && !isPending && <p className="mt-2 text-sm text-jade">Saved.</p>}
      {error && <p className="mt-2 text-sm text-lacquer">{error}</p>}
    </section>
  );
}
