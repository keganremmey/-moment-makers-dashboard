import { after } from "next/server";
import { UTM_KEYS, cleanParam, type Utm } from "@/lib/intro";
import { isBot, logIntroEvent } from "@/lib/intro-events";

// Beacon endpoint for the /intro page: "visit" on load, "cta_click" when a
// booking button is tapped. The calendar redirect is logged server-side by
// /intro/book instead.
const ALLOWED = new Set(["visit", "cta_click"]);

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const event = payload.event;
  if (typeof event !== "string" || !ALLOWED.has(event)) {
    return new Response(null, { status: 400 });
  }

  if (!isBot(request.headers.get("user-agent"))) {
    const raw = (payload.utm ?? {}) as Record<string, unknown>;
    const utm: Utm = {};
    for (const key of UTM_KEYS) {
      const value = cleanParam(raw[key]);
      if (value) utm[key] = value;
    }

    after(() =>
      logIntroEvent({
        event: event as "visit" | "cta_click",
        visitId: payload.visitId,
        cta: payload.cta,
        utm,
        referrer: payload.referrer,
      }),
    );
  }

  return new Response(null, { status: 204 });
}
