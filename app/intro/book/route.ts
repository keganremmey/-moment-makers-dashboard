import { after } from "next/server";
import { FREE_20_BOOKING_URL, utmFromParams } from "@/lib/intro";
import { isBot, logIntroEvent } from "@/lib/intro-events";

// Every booking button on /intro lands here, then goes straight on to the
// free 20-minute GoHighLevel calendar. The UTM values ride along on the
// calendar URL so GoHighLevel's contact attribution records which
// apartment flyer the booking came from. Logged as "booking_redirect":
// the person was sent to the calendar, which says nothing yet about
// whether they booked.
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const utm = utmFromParams(params);

  const target = new URL(FREE_20_BOOKING_URL);
  for (const [key, value] of Object.entries(utm)) target.searchParams.set(key, value);

  if (!isBot(request.headers.get("user-agent"))) {
    after(() =>
      logIntroEvent({
        event: "booking_redirect",
        visitId: params.get("vid"),
        cta: params.get("cta"),
        utm,
      }),
    );
  }

  return new Response(null, {
    status: 302,
    headers: { Location: target.toString(), "Cache-Control": "no-store" },
  });
}
