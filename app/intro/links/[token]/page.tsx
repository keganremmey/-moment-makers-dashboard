import { timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import LinkBuilder from "./LinkBuilder";

// Private tool for the apartment-flyer campaign: builds a tracked URL and
// QR code per property, and shows the on-page funnel per property.
// Gated by the same ADMIN_ACCESS_TOKEN as /admin/[token].

export const metadata: Metadata = {
  title: "Flyer links · Touch That Works",
  robots: { index: false, follow: false },
};

function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

type Row = { event: string; visit_id: string | null; utm_content: string | null; utm_source: string | null };
type Funnel = { key: string; visits: number; taps: number; sent: number };

async function loadFunnel(days: number): Promise<Funnel[] | null> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabaseServer()
    .from("intro_events")
    .select("event, visit_id, utm_content, utm_source")
    .gte("created_at", since)
    .range(0, 49_999);
  if (error) return null;

  // Counted per visit, so reloading the page or tapping twice counts once.
  const groups = new Map<string, { visits: Set<string>; taps: Set<string>; sent: Set<string> }>();
  let anonymous = 0;
  for (const row of (data as Row[]) ?? []) {
    const key = row.utm_content ?? (row.utm_source ? `(${row.utm_source}, no property)` : "(no tags: direct or typed)");
    const group = groups.get(key) ?? { visits: new Set(), taps: new Set(), sent: new Set() };
    const id = row.visit_id ?? `anonymous-${anonymous++}`;
    if (row.event === "visit") group.visits.add(id);
    if (row.event === "cta_click") group.taps.add(id);
    if (row.event === "booking_redirect") group.sent.add(id);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([key, g]) => ({ key, visits: g.visits.size, taps: g.taps.size, sent: g.sent.size }))
    .sort((a, b) => b.visits - a.visits);
}

function pct(part: number, whole: number) {
  return whole ? `${Math.round((part / whole) * 100)}%` : "–";
}

export default async function IntroLinksPage(props: PageProps<"/intro/links/[token]">) {
  const { token } = await props.params;
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;
  if (!adminToken || !tokensMatch(token, adminToken)) notFound();

  const funnel = await loadFunnel(90);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="font-ttw-mono text-xs uppercase tracking-[0.14em] text-ttw-copper">Private · Touch That Works</p>
      <h1 className="mt-2 font-ttw-serif text-4xl font-semibold">Apartment flyer links</h1>
      <p className="mt-3 text-ttw-muted">
        Type the property name. The QR code sends residents to /intro tagged with that property,
        and the tag follows them into the booking calendar.
      </p>

      <div className="mt-6">
        <LinkBuilder />
      </div>

      <h2 className="mt-12 font-ttw-serif text-2xl font-semibold">Last 90 days on the page</h2>
      <p className="mt-2 text-sm text-ttw-muted">
        Visits, taps on a booking button, and people sent into the calendar, each counted once per
        visit. Being sent to the calendar is not a booking.
      </p>

      {funnel === null ? (
        <p className="mt-4 rounded-md bg-ttw-cream-2 p-4">Couldn&apos;t load events from Supabase.</p>
      ) : funnel.length === 0 ? (
        <p className="mt-4 rounded-md bg-ttw-cream-2 p-4">No visits yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-ttw-line font-ttw-mono text-xs uppercase tracking-[0.1em] text-ttw-muted">
              <tr>
                <th scope="col" className="py-2 pr-4">Property (utm_content)</th>
                <th scope="col" className="py-2 pr-4 text-right">Visits</th>
                <th scope="col" className="py-2 pr-4 text-right">Tapped book</th>
                <th scope="col" className="py-2 text-right">Sent to calendar</th>
              </tr>
            </thead>
            <tbody>
              {funnel.map((f) => (
                <tr key={f.key} className="border-b border-ttw-line/60">
                  <td className="py-2 pr-4 font-ttw-mono">{f.key}</td>
                  <td className="py-2 pr-4 text-right">{f.visits}</td>
                  <td className="py-2 pr-4 text-right">
                    {f.taps} <span className="text-ttw-muted">({pct(f.taps, f.visits)})</span>
                  </td>
                  <td className="py-2 text-right">{f.sent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-12 font-ttw-serif text-2xl font-semibold">Booked, showed up, paid</h2>
      <div className="mt-2 space-y-3 text-ttw-muted">
        <p>
          Those steps happen in GoHighLevel, so they are counted there. Each calendar link carries
          the flyer&apos;s utm tags, which GoHighLevel saves on the contact&apos;s attribution.
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Booked: appointments on the Free 20 Min Tune Up calendar whose contact has UTM Content set to the property.</li>
          <li>Showed: the same appointments marked Showed.</li>
          <li>Paid: those contacts with a later 75-minute booking or payment.</li>
        </ol>
      </div>
    </main>
  );
}
