"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TextContact, TextDraft, TextMessage } from "@/lib/texts";

export type DraftCardData = {
  draft: TextDraft;
  contact: TextContact | null;
  thread: TextMessage[];
};

const URGENCY_LABEL = { now: "They're waiting", today: "Today", whenever: "No rush" } as const;
const CATEGORY_LABEL = {
  routine: "Routine",
  conversational: "Conversation",
  sensitive: "Handle with care",
  no_reply: "No reply needed",
} as const;

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DraftCard({
  data,
  adminToken,
  clients,
}: {
  data: DraftCardData;
  adminToken: string;
  clients: { id: string; name: string }[];
}) {
  const { draft, contact, thread } = data;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(draft.draft_text ?? "");
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(!contact?.display_name);

  const name = contact?.display_name ?? draft.handle;

  function post(url: string, body: Record<string, unknown>) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken, ...body }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? "Couldn't save, try again.");
        return;
      }
      router.refresh();
    });
  }

  const act = (action: string, extra: Record<string, unknown> = {}) =>
    post(`/api/texts/drafts/${draft.id}`, { action, ...extra });

  return (
    <section className="card flex flex-col gap-4 p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-lg text-ink">{name}</h2>
          {contact?.display_name && <p className="text-xs text-ink-dim">{draft.handle}</p>}
        </div>
        <div className="flex gap-2 text-xs">
          {draft.urgency && (
            <span
              className={`rounded-full border px-2 py-0.5 ${
                draft.urgency === "now" ? "border-lacquer text-lacquer" : "border-paper-line text-ink-dim"
              }`}
            >
              {URGENCY_LABEL[draft.urgency]}
            </span>
          )}
          {draft.category && (
            <span
              className={`rounded-full border px-2 py-0.5 ${
                draft.category === "sensitive" ? "border-gold text-ink" : "border-paper-line text-ink-dim"
              }`}
            >
              {CATEGORY_LABEL[draft.category]}
            </span>
          )}
        </div>
      </header>

      {draft.need && <p className="text-sm text-ink">{draft.need}</p>}

      {thread.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {thread.map((m) => (
            <li
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.is_from_me
                  ? "self-end bg-ink text-paper-raised"
                  : "self-start border border-paper-line bg-paper-raised text-ink"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className={`mt-0.5 text-[0.7rem] ${m.is_from_me ? "text-paper-line" : "text-ink-dim"}`}>
                {formatWhen(m.sent_at)}
              </p>
            </li>
          ))}
        </ol>
      )}

      {draft.status === "pending" && (
        <>
          <label className="flex flex-col gap-1">
            <span className="label text-xs">Your reply</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={Math.max(3, Math.ceil(text.length / 45))}
              className="w-full rounded-xl border border-paper-line bg-paper-raised p-3 text-base text-ink focus:border-lacquer focus:outline-none"
              placeholder="Type a reply, or tap Skip."
            />
          </label>
          {draft.fill_in && (
            <p className="text-sm text-lacquer">Fill in before sending: {draft.fill_in}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={isPending || text.trim().length === 0}
              onClick={() => act("send", { text })}
            >
              Send
            </button>
            <button type="button" className="btn btn-ghost" disabled={isPending} onClick={() => act("skip")}>
              Skip
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder='Change it: "shorter", "offer Thursday at 4"'
              className="min-w-0 flex-1 rounded-full border border-paper-line bg-paper-raised px-4 py-2 text-sm text-ink focus:border-lacquer focus:outline-none"
            />
            <button
              type="button"
              className="btn btn-outline"
              disabled={isPending}
              onClick={() => act("redo", { instruction })}
            >
              {isPending ? "Working..." : "Rewrite"}
            </button>
          </div>
        </>
      )}

      {draft.status === "approved" && (
        <p className="text-sm text-ink-dim">Queued. Your Mac will send it within a few seconds.</p>
      )}
      {draft.status === "sending" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink-dim">Your Mac is sending this now.</p>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={isPending}
            onClick={() => {
              if (window.confirm("Check Messages on your Mac first. If it already went out, this sends it twice. Retry?")) {
                act("retry");
              }
            }}
          >
            Stuck? Retry
          </button>
        </div>
      )}
      {draft.status === "failed" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-lacquer">Didn&apos;t send: {draft.error ?? "unknown error"}</p>
          <button type="button" className="btn btn-outline" disabled={isPending} onClick={() => act("retry")}>
            Retry
          </button>
        </div>
      )}
      {draft.status !== "pending" && draft.final_text && (
        <p className="rounded-2xl bg-ink px-3 py-2 text-sm text-paper-raised">{draft.final_text}</p>
      )}

      {error && <p className="text-sm text-lacquer">{error}</p>}

      <div className="border-t border-paper-line pt-3">
        <button
          type="button"
          className="text-xs text-ink-dim underline underline-offset-2"
          onClick={() => setShowContact((v) => !v)}
        >
          {showContact ? "Hide contact details" : "Who is this?"}
        </button>
        {showContact && (
          <ContactForm
            key={contact?.updated_at ?? draft.handle}
            handle={draft.handle}
            contact={contact}
            clients={clients}
            disabled={isPending}
            onSave={(fields) => post("/api/texts/contacts", { handle: draft.handle, ...fields })}
          />
        )}
      </div>
    </section>
  );
}

function ContactForm({
  handle,
  contact,
  clients,
  disabled,
  onSave,
}: {
  handle: string;
  contact: TextContact | null;
  clients: { id: string; name: string }[];
  disabled: boolean;
  onSave: (fields: Record<string, unknown>) => void;
}) {
  const [displayName, setDisplayName] = useState(contact?.display_name ?? "");
  const [clientId, setClientId] = useState(contact?.client_id ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");

  const inputClass =
    "w-full rounded-xl border border-paper-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-lacquer focus:outline-none";

  return (
    <div className="mt-3 flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-ink-dim">Name</span>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-ink-dim">Coaching client</span>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
          <option value="">Not a client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-ink-dim">Notes Claude reads before drafting</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="My brother. Keep it casual, no coaching talk."
          className={inputClass}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled}
          onClick={() => onSave({ display_name: displayName, client_id: clientId, notes })}
        >
          Save
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled}
          onClick={() => {
            if (
              window.confirm(
                `Stop drafting for ${displayName || handle}? Their texts will stay on your Mac and their history here gets deleted.`
              )
            ) {
              onSave({ mode: "ignore" });
            }
          }}
        >
          Stop drafting for this person
        </button>
      </div>
    </div>
  );
}
