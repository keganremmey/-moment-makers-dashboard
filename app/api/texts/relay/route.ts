import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { relayAuthorized, type TextDraft } from "@/lib/texts";

// The Mac relay polls this every few seconds.
//
// GET  claims every draft Kegan approved (approved -> sending) and returns
//      them for Messages to send, plus the handles Kegan muted so their
//      texts never leave the Mac.
// POST reports what happened to each claimed draft.

export async function GET(request: Request) {
  if (!relayAuthorized(request)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const supabase = supabaseServer();

  // A conditional update is atomic per row, so two relays running at once
  // can never both claim (and double-send) the same draft.
  const [{ data: claimedData, error: claimError }, { data: ignoredData }] = await Promise.all([
    supabase
      .from("text_drafts")
      .update({ status: "sending" } as never)
      .eq("status", "approved")
      .select("id, handle, chat_guid, final_text"),
    supabase.from("text_contacts").select("handle").eq("mode", "ignore"),
  ]);
  if (claimError) {
    console.error("text outbox claim error", claimError);
    return NextResponse.json({ error: "Claim failed." }, { status: 500 });
  }

  const claimed = (claimedData as Pick<TextDraft, "id" | "handle" | "chat_guid" | "final_text">[]) ?? [];
  return NextResponse.json({
    outbox: claimed
      .filter((d) => d.final_text)
      .map((d) => ({ id: d.id, handle: d.handle, chat_guid: d.chat_guid, text: d.final_text })),
    ignore: ((ignoredData as { handle: string }[]) ?? []).map((c) => c.handle),
  });
}

export async function POST(request: Request) {
  if (!relayAuthorized(request)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let payload: { results?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!Array.isArray(payload.results)) {
    return NextResponse.json({ error: "results must be an array." }, { status: 400 });
  }

  const supabase = supabaseServer();
  for (const raw of payload.results) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as { id?: unknown; ok?: unknown; error?: unknown };
    if (typeof r.id !== "string") continue;
    const update =
      r.ok === true
        ? { status: "sent", sent_at: new Date().toISOString(), error: null }
        : { status: "failed", error: typeof r.error === "string" ? r.error.slice(0, 500) : "Send failed." };
    await supabase.from("text_drafts").update(update as never).eq("id", r.id).eq("status", "sending");
  }

  return NextResponse.json({ ok: true });
}
