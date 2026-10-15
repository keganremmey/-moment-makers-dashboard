import { NextResponse } from "next/server";

// Server-side relay to the Body Under Pressure site. Its API has no CORS
// headers, so the /body event page posts here and this forwards the same
// JSON to body.wearemomentmakers.com. Scoring, Supabase rows, and the
// GoHighLevel text/email webhook all stay on the body site, unchanged.
const BODY_SITE = "https://body.wearemomentmakers.com";
const ALLOWED = new Set(["lead", "complete", "track"]);

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/body/[action]">,
) {
  const { action } = await ctx.params;
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await request.text();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers["User-Agent"] = userAgent;

  try {
    const upstream = await fetch(`${BODY_SITE}/api/${action}`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
    const text = await upstream.text();
    return new NextResponse(text || "{}", {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Check your connection and try again." },
      { status: 502 },
    );
  }
}
