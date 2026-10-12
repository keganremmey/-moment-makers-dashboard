import { notFound } from "next/navigation";
import {
  getClientByToken,
  getFrameworks,
  getFrameworkExamples,
  getQuotes,
  getSessions,
} from "@/lib/data";
import { LibraryBrowser } from "@/components/LibraryBrowser";

export default async function LibraryPage(
  props: PageProps<"/d/[token]/library">
) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const [frameworks, quotes, examples, sessions] = await Promise.all([
    getFrameworks(),
    getQuotes(client.id),
    getFrameworkExamples(),
    getSessions(client.id),
  ]);

  // Resolved here, not in the client component, for the same reason
  // wins/page.tsx joins by fathom_id in application code rather than a DB
  // foreign key: sessions.fathom_id isn't declared unique. An example whose
  // session isn't (yet) in this client's `sessions` table is dropped rather
  // than rendered with a dead link.
  const urlByFathomId = new Map(sessions.map((s) => [s.fathom_id, s.fathom_url]));
  const resolvedExamples = examples
    .map((e) => {
      const fathomUrl = urlByFathomId.get(e.fathom_id);
      return fathomUrl ? { ...e, fathomUrl } : null;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return (
    <LibraryBrowser
      frameworks={frameworks}
      quotes={quotes}
      examples={resolvedExamples}
    />
  );
}
