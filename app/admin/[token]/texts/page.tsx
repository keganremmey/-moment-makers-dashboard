import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import {
  adminAuthorized,
  type TextContact,
  type TextDraft,
  type TextMessage,
} from "@/lib/texts";
import { DraftCard, type DraftCardData } from "./DraftCard";
import { AutoRefresh } from "./AutoRefresh";

const URGENCY_ORDER = { now: 0, today: 1, whenever: 2 } as const;
const OPEN_STATUSES = ["pending", "approved", "sending", "failed"];
const DONE_STATUSES = ["sent", "skipped", "answered"];

export default async function TextsPage(props: PageProps<"/admin/[token]/texts">) {
  const { token } = await props.params;
  if (!adminAuthorized(token)) notFound();

  const supabase = supabaseServer();
  const [{ data: openData }, { data: doneData }, { data: clientData }] = await Promise.all([
    supabase.from("text_drafts").select("*").in("status", OPEN_STATUSES).order("created_at", { ascending: false }),
    supabase
      .from("text_drafts")
      .select("*")
      .in("status", DONE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase.from("clients").select("id, name").order("name"),
  ]);
  const open = (openData as TextDraft[]) ?? [];
  const done = (doneData as TextDraft[]) ?? [];
  const clients = (clientData as { id: string; name: string }[]) ?? [];

  const handles = [...new Set([...open, ...done].map((d) => d.handle))];
  const [{ data: contactData }, threadResults] = await Promise.all([
    handles.length > 0
      ? supabase.from("text_contacts").select("*").in("handle", handles)
      : Promise.resolve({ data: [] }),
    Promise.all(
      open.map((d) =>
        supabase
          .from("text_messages")
          .select("*")
          .eq("handle", d.handle)
          .order("sent_at", { ascending: false })
          .limit(6)
      )
    ),
  ]);
  const contacts = new Map(((contactData as TextContact[]) ?? []).map((c) => [c.handle, c]));

  const cards: DraftCardData[] = open.map((draft, i) => {
    const contact = contacts.get(draft.handle) ?? null;
    return {
      draft,
      contact,
      thread: ((threadResults[i].data as TextMessage[]) ?? []).reverse(),
    };
  });
  cards.sort((a, b) => {
    const ua = URGENCY_ORDER[a.draft.urgency ?? "whenever"];
    const ub = URGENCY_ORDER[b.draft.urgency ?? "whenever"];
    return ua - ub || b.draft.created_at.localeCompare(a.draft.created_at);
  });

  const needsReply = cards.filter((c) => c.draft.category !== "no_reply" || c.draft.status !== "pending");
  const noReply = cards.filter((c) => c.draft.category === "no_reply" && c.draft.status === "pending");

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <AutoRefresh seconds={20} />
      <div>
        <p className="label">Moment Makers</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Texts</h1>
        <p className="mt-2 text-sm text-ink-dim">
          New texts get a drafted reply here. Edit it, tap Send, and your Mac sends it from your
          number. Nothing goes out until you tap.
        </p>
      </div>

      {needsReply.length === 0 && (
        <p className="card p-5 text-base text-ink-dim">You&apos;re all caught up.</p>
      )}

      <div className="flex flex-col gap-4">
        {needsReply.map((c) => (
          <DraftCard key={c.draft.id} data={c} adminToken={token} clients={clients} />
        ))}
      </div>

      {noReply.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="label">Probably no reply needed</p>
          {noReply.map((c) => (
            <DraftCard key={c.draft.id} data={c} adminToken={token} clients={clients} />
          ))}
        </section>
      )}

      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="label">Recently handled</p>
          <ul className="card divide-y divide-paper-line p-0">
            {done.map((d) => {
              const name = contacts.get(d.handle)?.display_name ?? d.handle;
              const label =
                d.status === "sent" ? "Sent" : d.status === "answered" ? "You replied yourself" : "Skipped";
              return (
                <li key={d.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{name}</span>
                    <span className="text-xs text-ink-dim">{label}</span>
                  </div>
                  {d.status === "sent" && d.final_text && (
                    <p className="text-sm text-ink-dim">{d.final_text}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
