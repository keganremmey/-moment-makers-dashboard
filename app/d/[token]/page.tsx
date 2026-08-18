import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClientByToken,
  getFirstSessionDate,
  getSkills,
  getSkillReps,
  getTasks,
  getWins,
} from "@/lib/data";
import { supabaseServer } from "@/lib/supabase-server";
import { beltStatusForReps, BELT_COLORS } from "@/lib/belts";
import { computeProgramTimeline, formatShortDate } from "@/lib/timeline";
import { Trophy } from "@phosphor-icons/react/dist/ssr";
import { BeltChip } from "@/components/BeltChip";
import { GrowthMountain } from "@/components/GrowthMountain";
import { BeltLadder } from "@/components/BeltLadder";

function StatCard({
  label,
  value,
  caption,
  accentColor,
}: {
  label: string;
  value: string;
  caption: string;
  accentColor?: string;
}) {
  return (
    <div className="card p-5" style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}>
      <p className="label">{label}</p>
      <p className="mt-2 font-display text-4xl leading-none text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink-dim">{caption}</p>
    </div>
  );
}

export default async function OverviewPage(props: PageProps<"/d/[token]">) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const visionBoardUrl = client.vision_board_path
    ? (
        await supabaseServer()
          .storage.from("vision-boards")
          .createSignedUrl(client.vision_board_path, 3600)
      ).data?.signedUrl ?? null
    : null;

  const [skills, reps, tasks, wins, startedOn] = await Promise.all([
    getSkills(),
    getSkillReps(client.id),
    getTasks(client.id),
    getWins(client.id),
    getFirstSessionDate(client.id),
  ]);

  const timeline =
    startedOn && client.target_date
      ? computeProgramTimeline(startedOn, client.target_date)
      : null;

  const repCountBySkill = new Map<string, number>();
  for (const rep of reps) {
    repCountBySkill.set(rep.skill_id, (repCountBySkill.get(rep.skill_id) ?? 0) + 1);
  }

  const openTaskCount = tasks.filter((t) => t.status === "open").length;
  const slippedTaskCount = tasks.filter((t) => t.status === "slipped").length;
  // The 2-3 wins that lead the page , same `wins` query already fetched
  // above (ordered newest-first by getWins), just showing more of what's
  // already there instead of only the single latest one.
  const recentWins = wins.slice(0, 3);
  const mostRecentWin = recentWins[0];

  const identityWord = client.identity_names?.[0];

  // Skill statuses, computed once and reused by both the main "Skills at a
  // Glance" list and the rail's rank summary , no new data fetching, just a
  // summary of what getSkills/getSkillReps already returned.
  const skillStatuses = skills.map((skill) => ({
    skill,
    status: beltStatusForReps(repCountBySkill.get(skill.id) ?? 0),
  }));

  // The overview belt reflects total reps across every skill, not the best
  // single skill , a client spreading reps across four skills should see
  // their belt move even if no one skill has crossed a threshold alone.
  // Per-skill belts (Skills at a Glance, the full skill map) still use each
  // skill's own count, this only changes what the headline stat shows.
  const overallStatus = beltStatusForReps(reps.length);
  const overallBeltColor = BELT_COLORS[overallStatus.belt.name];

  // The skill closest to its next belt: the "almost there" gap, not a static
  // fact about where you already are. Naming the shortest distance to a real
  // reward is what makes someone want to close it, the same reason a
  // progress bar at 90% pulls harder than one sitting at 40%.
  const nearestPromotion = skillStatuses
    .filter((s) => s.status.nextBelt && s.status.repsToNext != null)
    .reduce<(typeof skillStatuses)[number] | null>(
      (closest, cur) =>
        !closest || cur.status.repsToNext! < closest.status.repsToNext!
          ? cur
          : closest,
      null
    );

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
            <div className="relative mt-2 inline-block">
              <p className="flourish font-display text-6xl uppercase tracking-tight leading-none">
                {identityWord}
              </p>
              {/* Ink-seal / chop stamp: a decorative mark, like a real seal
                  impression on a scroll , an abstract glyph, not real
                  calligraphy, offset from the identity word's baseline. */}
              <svg
                viewBox="0 0 40 40"
                aria-hidden="true"
                className="absolute -right-4 -top-3 h-9 w-9 rotate-6"
              >
                <rect x="2" y="2" width="36" height="36" rx="5" fill="var(--lacquer)" />
                <rect
                  x="2"
                  y="2"
                  width="36"
                  height="36"
                  rx="5"
                  fill="none"
                  stroke="var(--gold-bright)"
                  strokeWidth="1.5"
                  opacity="0.7"
                />
                <g stroke="var(--gold-bright)" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="20" x2="28" y2="20" />
                  <line x1="20" y1="12" x2="20" y2="28" />
                </g>
              </svg>
            </div>
          </section>
        )}

        {/* Wins lead the page , the client's own recorded evidence of
            progress, before any stat, chart, or logistics. This is the
            fullest version of the card language already established for
            North Star below (gold left rail, p-6, not the plain p-5 most
            cards use), now applied to the section that most makes a client
            want to keep opening this link. Static, not a click-through: it
            already carries its own "All wins" link inside, so the whole
            panel doesn't double as one giant door. */}
        <section className="card border-l-4 border-l-gold p-6">
          <div className="flex items-center gap-2">
            <Trophy weight="fill" className="h-4 w-4 text-gold" aria-hidden="true" />
            <p className="label">Recent Wins</p>
          </div>
          {mostRecentWin ? (
            <>
              <p className="mt-3 text-sm text-ink-dim">{formatShortDate(mostRecentWin.date)}</p>
              <p className="mt-1 text-pretty font-display text-2xl leading-snug text-ink">
                {mostRecentWin.title}
              </p>
              {mostRecentWin.description && (
                <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-ink-dim">
                  {mostRecentWin.description}
                </p>
              )}
              {recentWins.length > 1 && (
                <ul className="mt-4 flex flex-col gap-2 border-t border-paper-line pt-4">
                  {recentWins.slice(1).map((win) => (
                    <li key={win.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="label">{formatShortDate(win.date)}</span>
                      <span className="text-base text-ink">{win.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="mt-3 text-base text-ink-dim">Nothing logged yet.</p>
          )}
          <Link
            href={`/d/${token}/wins`}
            className="mt-4 inline-block text-sm text-lacquer hover:underline"
          >
            All wins →
          </Link>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Reps Logged"
            value={String(reps.length)}
            caption={reps.length === 0 ? "None yet, log one" : "Across every skill"}
          />
          <StatCard
            label="Open Tasks"
            value={String(openTaskCount)}
            caption={
              slippedTaskCount > 0
                ? `${slippedTaskCount} slipped, worth a look`
                : "Nothing slipping"
            }
          />
          <StatCard
            label="Current Belt"
            value={overallStatus.belt.name}
            accentColor={overallBeltColor}
            caption={
              overallStatus.nextBelt
                ? `${overallStatus.repsToNext} rep${overallStatus.repsToNext === 1 ? "" : "s"} to ${overallStatus.nextBelt.name}`
                : "Top belt reached"
            }
          />
          <StatCard
            label="Days to Summit"
            value={timeline ? String(Math.max(0, timeline.remainingDays)) : "TBD"}
            caption={
              timeline
                ? `${Math.max(0, timeline.elapsedDays)} of ${timeline.totalDays} days in`
                : "Target date not set"
            }
          />
        </section>

        <GrowthMountain reps={reps} />

        <section className="card p-5">
          <p className="label">Skills at a Glance</p>
          {skillStatuses.length === 0 ? (
            <p className="mt-4 text-base text-ink-dim">
              No skills tracked yet.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {skillStatuses.map(({ skill, status }) => (
                <li
                  key={skill.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-line pb-3 last:border-none last:pb-0"
                >
                  <div>
                    <p className="text-base text-ink">{skill.name}</p>
                    <p className="text-sm text-ink-dim">
                      {status.reps} rep{status.reps === 1 ? "" : "s"} logged
                    </p>
                  </div>
                  <BeltChip status={status} />
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/d/${token}/skills`}
            className="mt-4 inline-block text-sm text-lacquer hover:underline"
          >
            Full skill map →
          </Link>
        </section>

        {client.north_star && (
          <section className="card border-l-4 border-l-gold p-6">
            <p className="label">North Star</p>
            <p className="mt-3 text-pretty font-display text-2xl leading-snug text-ink">
              &ldquo;{client.north_star}&rdquo;
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-paper-line pt-3 font-mono text-xs uppercase tracking-wide text-ink-dim">
              {client.program && <span>{client.program}</span>}
              {startedOn && <span>Started {formatShortDate(startedOn)}</span>}
              {client.target_date && <span>Target {formatShortDate(client.target_date)}</span>}
              <span>{overallStatus.belt.name} rank</span>
            </div>
          </section>
        )}

        <section className="card overflow-hidden p-0">
          <div className="p-5 pb-0">
            <p className="label">Vision Board</p>
          </div>
          {visionBoardUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={visionBoardUrl}
              alt={`${client.identity_names?.[0] ?? client.name}'s vision board`}
              className="mt-3 w-full"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <p className="text-base text-ink-dim">
                Your vision board is on the way. Once it&apos;s ready, this is
                where you&apos;ll see yourself in it.
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        {nearestPromotion && (
          <section className="card p-5">
            <p className="label">Next Promotion</p>
            <p className="mt-2 font-display text-lg leading-snug text-ink">
              {nearestPromotion.skill.name}
            </p>
            <p className="mt-1 text-sm text-gold">
              {nearestPromotion.status.repsToNext} rep{nearestPromotion.status.repsToNext === 1 ? "" : "s"} to {nearestPromotion.status.nextBelt!.name}
            </p>
          </section>
        )}

        <section className="card p-5">
          <p className="label">Belt Ladder</p>
          <p className="mt-1 text-xs text-ink-dim">
            Which version of you shows up under pressure, right now.
          </p>
          <div className="mt-3">
            <BeltLadder currentBeltName={overallStatus.belt.name} compact />
          </div>
        </section>
      </aside>
    </div>
  );
}
