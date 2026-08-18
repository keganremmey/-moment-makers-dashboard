import { randomUUID } from "node:crypto";
import { NextResponse, after } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getClientByToken } from "@/lib/data";
import { transcribeAudio } from "@/lib/transcription";
import { refreshPatterns } from "@/lib/patterns-refresh";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

// The client is looked up directly by its access_token (same as
// getClientByToken on every /d/[token] page), so a successful row match
// already proves the token is correct via the query itself , there's no
// separate key to compare it against with timingSafeEqual, unlike
// app/api/tasks/[id]/toggle which looks up by task id first.
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = formData.get("token");
  const audio = formData.get("audio");
  const durationSecondsRaw = formData.get("durationSeconds");

  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Missing audio." }, { status: 400 });
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio file too large." }, { status: 413 });
  }

  const client = await getClientByToken(token);
  if (!client) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const durationSeconds =
    typeof durationSecondsRaw === "string" && durationSecondsRaw.length > 0
      ? Number(durationSecondsRaw)
      : null;

  const buffer = Buffer.from(await audio.arrayBuffer());
  const audioPath = `${client.id}/${randomUUID()}.webm`;

  const supabase = supabaseServer();

  const { error: uploadError } = await supabase.storage
    .from("journal-audio")
    .upload(audioPath, buffer, { contentType: "audio/webm" });

  if (uploadError) {
    console.error("journal audio upload error", uploadError);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  const { data: insertedData, error: insertError } = await supabase
    .from("journal_entries")
    .insert({
      client_id: client.id,
      audio_path: audioPath,
      duration_seconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    } as never)
    .select("id")
    .single();
  const inserted = insertedData as { id: string } | null;

  if (insertError || !inserted) {
    console.error("journal entry insert error", insertError);
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }

  const transcription = await transcribeAudio(buffer, "entry.webm");

  if (transcription) {
    const { error: updateError } = await supabase
      .from("journal_entries")
      .update({
        transcript: transcription.transcript,
        word_count: transcription.wordCount,
        transcribed_at: new Date().toISOString(),
      } as never)
      .eq("id", inserted.id);

    if (updateError) {
      console.error("journal entry transcript update error", updateError);
    }
  }

  // A transcribed journal entry counts as evidence for pattern analysis, so
  // it invalidates the documented patterns exactly like a new session does.
  // Untranscribed uploads add nothing readable, so they do not trigger.
  if (transcription) {
    after(async () => {
      try {
        const result = await refreshPatterns(client.id);
        console.log("Journal upload: pattern refresh:", JSON.stringify(result));
      } catch (err) {
        console.error("Journal upload: pattern refresh failed", err);
      }
    });
  }

  return NextResponse.json({ id: inserted.id, transcribed: transcription !== null });
}
