import { notFound } from "next/navigation";
import { getClientByToken, getJournalEntries } from "@/lib/data";
import { supabaseServer } from "@/lib/supabase-server";
import { formatShortDate } from "@/lib/timeline";
import { AudioRecorder } from "@/components/AudioRecorder";

function formatDuration(seconds: number): string {
  const mm = Math.floor(seconds / 60);
  const ss = Math.round(seconds % 60);
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

export default async function JournalPage(props: PageProps<"/d/[token]/journal">) {
  const { token } = await props.params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const entries = await getJournalEntries(client.id);

  const supabase = supabaseServer();
  const signedUrls = await Promise.all(
    entries.map((entry) =>
      supabase.storage.from("journal-audio").createSignedUrl(entry.audio_path, 3600)
    )
  );

  return (
    <div className="flex flex-col gap-4">
      <AudioRecorder token={client.access_token} />

      {entries.length === 0 && (
        <p className="text-base text-ink-dim">Nothing recorded yet.</p>
      )}

      {entries.map((entry, i) => {
        const signedUrl = signedUrls[i].data?.signedUrl;
        return (
          <article key={entry.id} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="label">{formatShortDate(entry.created_at.split("T")[0])}</p>
              {entry.duration_seconds != null && (
                <p className="label">{formatDuration(entry.duration_seconds)}</p>
              )}
            </div>
            {signedUrl && (
              <audio controls src={signedUrl} className="mt-3 w-full" />
            )}
            <p className="mt-3 text-base leading-relaxed text-ink-dim">
              {entry.transcript ?? "Transcribing..."}
            </p>
            {entry.word_count != null && (
              <p className="label mt-2">{entry.word_count} words</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
