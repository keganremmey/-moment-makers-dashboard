import { notFound } from "next/navigation";
import { getClientByToken, getSessions, getWins } from "@/lib/data";

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
        <p className="text-base text-paper-dim">No wins logged yet.</p>
      )}
      {wins.map((win) => {
        const session = win.source_session_fathom_id
          ? sessionByFathomId.get(win.source_session_fathom_id)
          : undefined;

        return (
          <article key={win.id} className="card p-5">
            <p className="label">{win.date}</p>
            <h2 className="mt-2 font-display text-lg text-paper">
              {win.title}
            </h2>
            {win.description && (
              <p className="mt-2 text-base leading-relaxed text-paper-dim">
                {win.description}
              </p>
            )}
            {session && (
              <p className="mt-3 text-sm text-brass">
                From: {session.title} ({session.date})
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
