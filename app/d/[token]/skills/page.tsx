import { notFound } from "next/navigation";
import { getClientByToken, getSkillReps, getSkills } from "@/lib/data";
import { beltStatusForReps } from "@/lib/belts";
import { BeltChip } from "@/components/BeltChip";
import { BeltLadder } from "@/components/BeltLadder";

export default async function SkillsPage(
  props: PageProps<"/d/[token]/skills">
) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const [skills, reps] = await Promise.all([
    getSkills(),
    getSkillReps(client.id),
  ]);

  const repsBySkill = new Map<string, typeof reps>();
  for (const rep of reps) {
    const list = repsBySkill.get(rep.skill_id) ?? [];
    list.push(rep);
    repsBySkill.set(rep.skill_id, list);
  }

  // The single highest rank reached across every skill , same "farthest
  // point so far" marker used on the Overview rail, so the roadmap reads
  // consistently wherever it shows up.
  const highestReps = skills.reduce((max, skill) => {
    const count = (repsBySkill.get(skill.id) ?? []).length;
    return Math.max(max, count);
  }, 0);
  const highestBelt = skills.length > 0 ? beltStatusForReps(highestReps).belt.name : null;

  return (
    <div className="flex flex-col gap-6">
      {skills.length === 0 && (
        <p className="text-base text-ink-dim">No skills tracked yet.</p>
      )}

      {skills.length > 0 && (
        <section className="card p-5">
          <p className="label">Belt Ladder: The Full Roadmap</p>
          <p className="mt-1 text-sm text-ink-dim">
            Every rank is a different version of you in the room. White still hesitates.
            Black doesn&apos;t think about it anymore, it just happens.
          </p>
          <div className="mt-4">
            <BeltLadder currentBeltName={highestBelt} />
          </div>
        </section>
      )}
      {skills.map((skill) => {
        const skillReps = repsBySkill.get(skill.id) ?? [];
        const status = beltStatusForReps(skillReps.length);

        return (
          <section key={skill.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-ink">
                  {skill.name}
                </h2>
                {skill.description && (
                  <p className="mt-1 text-base text-ink-dim">
                    {skill.description}
                  </p>
                )}
              </div>
              <BeltChip status={status} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-dim">
              <span>
                {status.reps} rep{status.reps === 1 ? "" : "s"} logged
              </span>
              {status.nextBelt ? (
                <span>
                  · {status.repsToNext} more to {status.nextBelt.name}
                </span>
              ) : (
                <span className="text-gold">· top belt reached</span>
              )}
            </div>

            {skillReps.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 border-t border-paper-line pt-4">
                {skillReps.map((rep) => (
                  <li key={rep.id} className="text-base">
                    <span className="label mr-2">{rep.date}</span>
                    <span className="text-ink">{rep.note}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
