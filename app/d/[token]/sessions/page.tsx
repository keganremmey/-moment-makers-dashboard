import { notFound } from "next/navigation";
import { getClientByToken, getSessions } from "@/lib/data";
import { renderInlineMarkdown } from "@/lib/markdown";

export default async function SessionsPage(
  props: PageProps<"/d/[token]/sessions">
) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const sessions = await getSessions(client.id);

  return (
    <div className="flex flex-col gap-4">
      {sessions.length === 0 && (
        <p className="text-base text-paper-dim">No sessions logged yet.</p>
      )}
      {sessions.map((session) => (
        <article key={session.id} className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="label">
              {session.date}
              {session.session_number != null &&
                ` · Session ${session.session_number}`}
            </p>
            <a
              href={session.fathom_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brass hover:underline"
            >
              Watch on Fathom →
            </a>
          </div>
          <h2 className="mt-2 font-display text-lg text-paper">
            {session.title}
          </h2>
          {session.purpose && (
            <p className="mt-1 text-base italic text-paper-dim">
              {session.purpose}
            </p>
          )}
          {session.summary_md && (
            <p
              className="mt-3 text-base leading-relaxed text-paper"
              dangerouslySetInnerHTML={{
                __html: renderInlineMarkdown(session.summary_md),
              }}
            />
          )}
        </article>
      ))}
    </div>
  );
}
