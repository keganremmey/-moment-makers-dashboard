import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { adminAuthorized, generateDraft, type TextDraft } from "@/lib/texts";

// Kegan's buttons on the review page.
//   send   approve the (possibly edited) text; the relay sends it next poll
//   skip   no reply needed
//   redo   rewrite the draft, optionally with an instruction ("shorter")
//   retry  put a failed or stuck send back in the outbox
export const maxDuration = 120;

const MAX_TEXT_CHARS = 2000;

export async function POST(request: Request, ctx: RouteContext<"/api/texts/drafts/[id]">) {
  const { id } = await ctx.params;

  let body: { adminToken?: unknown; action?: unknown; text?: unknown; instruction?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!adminAuthorized(body.adminToken)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const supabase = supabaseServer();
  const { data } = await supabase.from("text_drafts").select("*").eq("id", id).maybeSingle();
  const draft = data as TextDraft | null;
  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });

  switch (body.action) {
    case "send": {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (text.length === 0 || text.length > MAX_TEXT_CHARS) {
        return NextResponse.json({ error: "Text is empty or too long." }, { status: 400 });
      }
      if (/\[[^\]]+\]/.test(text)) {
        return NextResponse.json(
          { error: "Fill in the [bracketed] parts before sending." },
          { status: 400 }
        );
      }
      const { data: updated } = await supabase
        .from("text_drafts")
        .update({ status: "approved", final_text: text, approved_at: new Date().toISOString() } as never)
        .eq("id", id)
        .eq("status", "pending")
        .select("id");
      if (!updated || updated.length === 0) {
        return NextResponse.json(
          { error: "This draft is no longer open. A newer text may have come in." },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    case "skip": {
      await supabase
        .from("text_drafts")
        .update({ status: "skipped" } as never)
        .eq("id", id)
        .eq("status", "pending");
      return NextResponse.json({ ok: true });
    }

    case "redo": {
      if (draft.status !== "pending") {
        return NextResponse.json({ error: "This draft is no longer open." }, { status: 409 });
      }
      const instruction =
        typeof body.instruction === "string" ? body.instruction.trim().slice(0, 500) : "";
      try {
        const next = await generateDraft(draft.handle, {
          instruction: instruction || "Write a fresh version.",
          previousDraft: draft.draft_text ?? undefined,
        });
        if (!next) {
          return NextResponse.json(
            { error: "Nothing to reply to. Your message is the latest in the thread." },
            { status: 409 }
          );
        }
        return NextResponse.json({ ok: true });
      } catch (err) {
        console.error("text redo failed", err);
        return NextResponse.json({ error: "Couldn't rewrite it. Try again." }, { status: 502 });
      }
    }

    case "retry": {
      // Only for sends that failed, or that a relay claimed and never
      // reported back on. Check Messages on the Mac first: a stuck send may
      // have gone out before the relay stopped.
      await supabase
        .from("text_drafts")
        .update({ status: "approved", error: null } as never)
        .eq("id", id)
        .in("status", ["failed", "sending"]);
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
