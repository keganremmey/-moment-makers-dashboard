import { notFound } from "next/navigation";
import { Trophy } from "@phosphor-icons/react/dist/ssr";
import { getClientByToken, getSessions, getWins } from "@/lib/data";
import { formatShortDate } from "@/lib/timeline";

export default async function WinsPage(props: PageProps<"/d/[token]/wins">) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const [wins, sessions] = await Promise.all([
    getWins(client.id),
    getSessions(client.id),
  ]);

  const sessionByFathomId = new Map(sessions.map((s) => [s.fathom_id, s]));

  return (
    <div className="flex flex-col gap-4">
      {wins.length === 0 && (
        <p className="text-base text-ink-dim">No wins logged yet.</p>
      )}
      {wins.map((win, i) => {
        const session = win.source_session_fathom_id
          ? sessionByFathomId.get(win.source_session_fathom_id)
          : undefined;
        // The single most recent win (index 0, `getWins` orders newest
        // first) gets the same gold-rail "fullest version of the card"
        // treatment as the Overview promoted panel , everything below it
        // stays the plain card, so the list still reads as one win
        // standing out among many, not a page of equally loud trophies.
        const isLatest = i === 0;

        return (
          <article
            key={win.id}
            className={`card p-5${isLatest ? " border-l-4 border-l-gold" : ""}`}
          >
            <div className="flex items-center gap-2">
              {isLatest && (
                <Trophy weight="fill" className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              )}
              <p className="label">{formatShortDate(win.date)}</p>
            </div>
            <h2 className={`mt-2 font-display leading-snug text-ink ${isLatest ? "text-xl" : "text-lg"}`}>
              {win.title}
            </h2>
            {win.description && (
              <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-ink-dim">
                {win.description}
              </p>
            )}
            {session && (
              <p className="mt-3 text-sm text-gold">
                From: {session.title} ({session.date})
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
