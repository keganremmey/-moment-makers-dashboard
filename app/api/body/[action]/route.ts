import { NextResponse, after } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

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
    const send = (payload: string) =>
      fetch(`${BODY_SITE}/api/${action}`, { method: "POST", headers, body: payload, cache: "no-store" });
    let upstream = await send(body);
    // The body site may not know about lastName yet. If it rejects the
    // payload as invalid, retry once without it so event signups still work.
    if (action === "lead" && (upstream.status === 400 || upstream.status === 422)) {
      try {
        const parsed = JSON.parse(body) as Record<string, unknown>;
        if ("lastName" in parsed) {
          delete parsed.lastName;
          upstream = await send(JSON.stringify(parsed));
        }
      } catch {}
    }
    const text = await upstream.text();
    // The body site stores first name only. Keep the last name on the row too.
    if (action === "lead" && upstream.ok) {
      try {
        const sent = JSON.parse(body) as { lastName?: unknown };
        const saved = JSON.parse(text) as { id?: unknown };
        const lastName = typeof sent.lastName === "string" ? sent.lastName.trim().slice(0, 60) : "";
        if (lastName && typeof saved.id === "string") {
          after(async () => {
            try {
              await supabaseServer().from("bup_results").update({ last_name: lastName } as never).eq("id", saved.id as string);
            } catch {}
          });
        }
      } catch {}
    }
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
