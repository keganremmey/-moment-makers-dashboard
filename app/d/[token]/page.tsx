import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClientByToken,
  getSkills,
  getSkillReps,
  getTasks,
  getWins,
} from "@/lib/data";
import { BELTS, beltStatusForReps } from "@/lib/belts";
import { BeltChip } from "@/components/BeltChip";

export default async function OverviewPage(props: PageProps<"/d/[token]">) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const [skills, reps, tasks, wins] = await Promise.all([
    getSkills(),
    getSkillReps(client.id),
    getTasks(client.id),
    getWins(client.id),
  ]);

  const repCountBySkill = new Map<string, number>();
  for (const rep of reps) {
    repCountBySkill.set(rep.skill_id, (repCountBySkill.get(rep.skill_id) ?? 0) + 1);
  }

  const openTaskCount = tasks.filter((t) => t.status === "open").length;
  const slippedTaskCount = tasks.filter((t) => t.status === "slipped").length;
  const mostRecentWin = wins[0];

  const identityWord = client.identity_names?.[0];

  // Skill statuses, computed once and reused by both the main "Skills at a
  // Glance" list and the rail's rank summary — no new data fetching, just a
  // summary of what getSkills/getSkillReps already returned.
  const skillStatuses = skills.map((skill) => ({
    skill,
    status: beltStatusForReps(repCountBySkill.get(skill.id) ?? 0),
  }));

  const beltCounts = BELTS.map((b) => ({
    name: b.name,
    count: skillStatuses.filter((s) => s.status.belt.name === b.name).length,
  })).filter((b) => b.count > 0);

  const highestRanked = skillStatuses.reduce<
    (typeof skillStatuses)[number] | null
  >((best, cur) => (!best || cur.status.reps > best.status.reps ? cur : best), null);

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-8">
        {identityWord && (
          <section
            style={
              client.accent_hex
                ? ({ "--client-accent": client.accent_hex } as CSSProperties)
                : undefined
            }
          >
            <p className="label">Identity</p>
            <p className="flourish mt-2 font-display text-6xl uppercase tracking-tight leading-none">
              {identityWord}
            </p>
          </section>
        )}

        {client.north_star && (
          <section className="card p-5">
            <p className="label">North Star</p>
            <p className="mt-2 font-display text-lg leading-snug text-paper">
              {client.north_star}
            </p>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href={`/d/${token}/tasks`} className="card block p-5 transition-colors hover:border-brass-dim">
            <p className="label">Open Tasks</p>
            <p className="mt-2 font-display text-3xl text-paper">{openTaskCount}</p>
            {slippedTaskCount > 0 && (
              <p className="mt-1 text-sm text-brass">
                {slippedTaskCount} slipped — worth a look
              </p>
            )}
          </Link>

          <Link href={`/d/${token}/wins`} className="card block p-5 transition-colors hover:border-brass-dim">
            <p className="label">Most Recent Win</p>
            {mostRecentWin ? (
              <>
                <p className="mt-2 font-display text-lg leading-snug text-paper">
                  {mostRecentWin.title}
                </p>
                <p className="mt-1 text-sm text-paper-dim">{mostRecentWin.date}</p>
              </>
            ) : (
              <p className="mt-2 text-base text-paper-dim">Nothing logged yet.</p>
            )}
          </Link>
        </section>

        <section className="card p-5">
          <p className="label">Skills at a Glance</p>
          <ul className="mt-4 flex flex-col gap-3">
            {skillStatuses.map(({ skill, status }) => (
              <li
                key={skill.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-line pb-3 last:border-none last:pb-0"
              >
                <div>
                  <p className="text-base text-paper">{skill.name}</p>
                  <p className="text-sm text-paper-dim">
                    {status.reps} rep{status.reps === 1 ? "" : "s"} logged
                  </p>
                </div>
                <BeltChip status={status} />
              </li>
            ))}
          </ul>
          <Link
            href={`/d/${token}/skills`}
            className="mt-4 inline-block text-sm text-brass hover:underline"
          >
            Full skill map →
          </Link>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        {beltCounts.length > 0 && (
          <section className="card p-5">
            <p className="label">Rank Summary</p>
            <ul className="mt-3 flex flex-col gap-2">
              {beltCounts.map((b) => (
                <li key={b.name} className="flex items-center justify-between text-sm">
                  <span className="text-paper">{b.name}</span>
                  <span className="font-mono text-paper-dim">{b.count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {highestRanked && (
          <section className="card p-5">
            <p className="label">Highest Rank</p>
            <p className="mt-2 font-display text-lg leading-snug text-paper">
              {highestRanked.skill.name}
            </p>
            <p className="mt-1 text-sm text-paper-dim">
              {highestRanked.status.belt.name} belt · {highestRanked.status.reps} reps
            </p>
          </section>
        )}
      </aside>
    </div>
  );
}
