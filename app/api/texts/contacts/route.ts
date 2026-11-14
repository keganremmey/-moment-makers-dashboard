import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { adminAuthorized } from "@/lib/texts";

// Name a contact, link them to a coaching client, add notes the drafter
// reads, or mute them (mode 'ignore': their texts stop leaving the Mac).
export async function POST(request: Request) {
  let body: {
    adminToken?: unknown;
    handle?: unknown;
    display_name?: unknown;
    client_id?: unknown;
    mode?: unknown;
    notes?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!adminAuthorized(body.adminToken)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  if (typeof body.handle !== "string" || body.handle.length === 0) {
    return NextResponse.json({ error: "Missing handle." }, { status: 400 });
  }

  const clean = (v: unknown, max: number) =>
    typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, max) : null;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("display_name" in body) update.display_name = clean(body.display_name, 120);
  if ("notes" in body) update.notes = clean(body.notes, 2000);
  if ("client_id" in body) update.client_id = clean(body.client_id, 64);
  if ("mode" in body) {
    if (body.mode !== "draft" && body.mode !== "ignore") {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }
    update.mode = body.mode;
  }

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("text_contacts")
    .update(update as never)
    .eq("handle", body.handle);
  if (error) {
    console.error("text contact update error", error);
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }

  // Muting someone also clears their open draft and their stored history.
  if (update.mode === "ignore") {
    await supabase
      .from("text_drafts")
      .update({ status: "skipped" } as never)
      .eq("handle", body.handle)
      .eq("status", "pending");
    await supabase.from("text_messages").delete().eq("handle", body.handle);
  }

  return NextResponse.json({ ok: true });
}
