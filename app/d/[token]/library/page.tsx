import { notFound } from "next/navigation";
import { getClientByToken, getFrameworks, getQuotes } from "@/lib/data";
import { LibraryBrowser } from "@/components/LibraryBrowser";

export default async function LibraryPage(
  props: PageProps<"/d/[token]/library">
) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const [frameworks, quotes] = await Promise.all([
    getFrameworks(),
    getQuotes(client.id),
  ]);

  return <LibraryBrowser frameworks={frameworks} quotes={quotes} />;
}
