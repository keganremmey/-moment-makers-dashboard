import { after } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Beacon endpoint for event-quiz metrics. The relay's bup_track RPC drops any
// event name it does not know, so these rows go straight into bup_events.
// Only whitelisted names with small numeric or short string props are stored.
const ALLOWED = new Set([
  "contact_form_timing",
  "contact_form_error",
  "quiz_timing",
  "results_page_view",
  "results_scroll_milestone",
  "results_section_reached",
  "results_time_on_page",
  "results_cta_click",
  "results_pdf_click",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOTS = /bot\b|bot\/|crawler|spider|preview|facebookexternalhit|whatsapp|slack|headless/i;

function cleanProps(raw: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = { version: "event-v1" };
  if (!raw || typeof raw !== "object") return out;
  let n = 0;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (n++ >= 20 || key.length > 40) continue;
    if (typeof value === "number" && Number.isFinite(value)) out[key] = Math.round(value);
    else if (typeof value === "string") out[key] = value.slice(0, 80);
    else if (typeof value === "boolean") out[key] = value;
    else if (Array.isArray(value) && value.length <= 10 && value.every((v) => typeof v === "number" && Number.isFinite(v))) {
      out[key] = value.map((v) => Math.round(v as number));
    }
  }
  out.version = "event-v1";
  return out;
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = payload.event;
  if (typeof event !== "string" || !ALLOWED.has(event)) return new Response(null, { status: 400 });
  if (BOTS.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });

  const resultId = typeof payload.resultId === "string" && UUID.test(payload.resultId) ? payload.resultId : null;
  const sessionId = typeof payload.sessionId === "string" ? payload.sessionId.slice(0, 64) : null;
  const props = cleanProps(payload.props);

  after(async () => {
    try {
      await supabaseServer()
        .from("bup_events")
        .insert({ event, session_id: sessionId, result_id: resultId, props } as never);
    } catch {}
  });
  return new Response(null, { status: 204 });
}
