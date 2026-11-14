import { NextResponse, after } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { generateDraft, notifyNewDraft, relayAuthorized, type TextContact } from "@/lib/texts";

// The Mac relay posts new texts here (plus a little recent history so the
// drafter has context). Replies are drafted after the response returns, so
// the relay is never left waiting on Claude.
export const maxDuration = 120;

type InboundMessage = {
  guid: string;
  handle: string;
  chat_guid: string | null;
  is_from_me: boolean;
  body: string;
  sent_at: string;
};

const MAX_BATCH = 500;
const MAX_BODY_CHARS = 4000;

function parseMessage(raw: unknown): InboundMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  if (typeof m.guid !== "string" || m.guid.length === 0) return null;
  if (typeof m.handle !== "string" || m.handle.length === 0) return null;
  if (typeof m.body !== "string" || m.body.trim().length === 0) return null;
  if (typeof m.is_from_me !== "boolean") return null;
  if (typeof m.sent_at !== "string" || Number.isNaN(Date.parse(m.sent_at))) return null;
  return {
    guid: m.guid,
    handle: m.handle,
    chat_guid: typeof m.chat_guid === "string" ? m.chat_guid : null,
    is_from_me: m.is_from_me,
    body: m.body.slice(0, MAX_BODY_CHARS),
    sent_at: new Date(m.sent_at).toISOString(),
  };
}

export async function POST(request: Request) {
  if (!relayAuthorized(request)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let payload: { messages?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!Array.isArray(payload.messages) || payload.messages.length > MAX_BATCH) {
    return NextResponse.json({ error: "messages must be an array of up to 500." }, { status: 400 });
  }

  const parsed = payload.messages.map(parseMessage).filter((m): m is InboundMessage => m !== null);
  if (parsed.length === 0) return NextResponse.json({ stored: 0 });

  const supabase = supabaseServer();
  const handles = [...new Set(parsed.map((m) => m.handle))];

  // New people get a contact row in 'draft' mode. Existing rows keep the
  // name, client link and mode Kegan already set.
  const { error: contactError } = await supabase
    .from("text_contacts")
    .upsert(handles.map((handle) => ({ handle })) as never, {
      onConflict: "handle",
      ignoreDuplicates: true,
    });
  if (contactError) {
    console.error("text contact upsert error", contactError);
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }

  const { data: contactData } = await supabase
    .from("text_contacts")
    .select("handle, mode")
    .in("handle", handles);
  const ignored = new Set(
    ((contactData as Pick<TextContact, "handle" | "mode">[]) ?? [])
      .filter((c) => c.mode === "ignore")
      .map((c) => c.handle)
  );
  const toStore = parsed.filter((m) => !ignored.has(m.handle));
  if (toStore.length === 0) return NextResponse.json({ stored: 0 });

  // ignoreDuplicates makes this return only the rows that are actually new,
  // so resent history never triggers a second draft.
  const { data: insertedData, error: insertError } = await supabase
    .from("text_messages")
    .upsert(toStore as never, { onConflict: "guid", ignoreDuplicates: true })
    .select("guid, handle, is_from_me, sent_at");
  if (insertError) {
    console.error("text message insert error", insertError);
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }
  const inserted =
    (insertedData as { guid: string; handle: string; is_from_me: boolean; sent_at: string }[]) ?? [];

  // Newest new message per person decides what happens next.
  const newestByHandle = new Map<string, (typeof inserted)[number]>();
  for (const m of inserted) {
    const current = newestByHandle.get(m.handle);
    if (!current || m.sent_at > current.sent_at) newestByHandle.set(m.handle, m);
  }

  const toDraft: string[] = [];
  for (const [handle, newest] of newestByHandle) {
    if (newest.is_from_me) {
      // Kegan answered from his phone. The open draft is out of date.
      await supabase
        .from("text_drafts")
        .update({ status: "answered" } as never)
        .eq("handle", handle)
        .eq("status", "pending");
    } else {
      toDraft.push(handle);
    }
  }

  after(async () => {
    for (const handle of toDraft) {
      try {
        const draft = await generateDraft(handle);
        if (draft) await notifyNewDraft(draft);
      } catch (err) {
        console.error("text draft generation failed", handle, err);
      }
    }
  });

  return NextResponse.json({ stored: inserted.length, drafting: toDraft.length });
}
