import { supabaseServer } from "@/lib/supabase-server";
import { cleanParam, type Utm } from "@/lib/intro";

export type IntroEvent = "visit" | "cta_click" | "booking_redirect";

// Writes one funnel row. Never throws: a logging failure must not stop
// anyone from reaching the booking calendar.
export async function logIntroEvent(row: {
  event: IntroEvent;
  visitId?: unknown;
  cta?: unknown;
  utm?: Utm;
  referrer?: unknown;
}) {
  try {
    let referrerHost: string | null = null;
    const referrer = cleanParam(row.referrer, 500);
    if (referrer) {
      try {
        referrerHost = new URL(referrer).host.slice(0, 120);
      } catch {}
    }

    await supabaseServer()
      .from("intro_events")
      .insert({
        event: row.event,
        visit_id: cleanParam(row.visitId, 64),
        cta: cleanParam(row.cta, 40),
        utm_source: row.utm?.utm_source ?? null,
        utm_medium: row.utm?.utm_medium ?? null,
        utm_campaign: row.utm?.utm_campaign ?? null,
        utm_content: row.utm?.utm_content ?? null,
        utm_term: row.utm?.utm_term ?? null,
        referrer_host: referrerHost,
      } as never);
  } catch {}
}

const BOTS = /bot\b|bot\/|crawler|spider|preview|facebookexternalhit|whatsapp|slack|headless/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOTS.test(userAgent);
}
