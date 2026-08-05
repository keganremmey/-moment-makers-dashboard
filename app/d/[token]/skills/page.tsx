import { notFound } from "next/navigation";
import { getClientByToken, getSkillReps, getSkills } from "@/lib/data";
import { beltStatusForReps } from "@/lib/belts";
import { BeltChip } from "@/components/BeltChip";

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

  return (
    <div className="flex flex-col gap-6">
      {skills.length === 0 && (
        <p className="text-base text-paper-dim">No skills tracked yet.</p>
      )}
      {skills.map((skill) => {
        const skillReps = repsBySkill.get(skill.id) ?? [];
        const status = beltStatusForReps(skillReps.length);

        return (
          <section key={skill.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-paper">
                  {skill.name}
                </h2>
                {skill.description && (
                  <p className="mt-1 text-base text-paper-dim">
                    {skill.description}
                  </p>
                )}
              </div>
              <BeltChip status={status} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-paper-dim">
              <span>
                {status.reps} rep{status.reps === 1 ? "" : "s"} logged
              </span>
              {status.nextBelt ? (
                <span>
                  · {status.repsToNext} more to {status.nextBelt.name}
                </span>
              ) : (
                <span className="text-brass">· top belt reached</span>
              )}
            </div>

            {skillReps.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 border-t border-ink-line pt-4">
                {skillReps.map((rep) => (
                  <li key={rep.id} className="text-base">
                    <span className="label mr-2">{rep.date}</span>
                    <span className="text-paper">{rep.note}</span>
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
