import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// This route lets Fathom automatically create a `sessions` row when a new
// coaching-call recording is ready, instead of Kegan asking Claude Code to
// do it by hand. It deliberately does NOT extract wins/tasks/skill-reps/
// frameworks from the transcript — that stays a human+Claude-Code step for
// now (see the dispatch contract this was built from).

// --- Signature verification (Svix-style, per Fathom's webhook spec) ---
//
// Fathom signs webhook deliveries the same way Svix does: three headers
// (`webhook-id`, `webhook-timestamp`, `webhook-signature`) sign the exact
// raw request body. The signing secret is handed to us as `whsec_<base64>`;
// the `whsec_` prefix is stripped and the remainder base64-decoded to get
// the raw HMAC key bytes.
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

// Same constant-time comparison pattern as
// app/api/tasks/[id]/toggle/route.ts's `tokensMatch` — a plain !== would
// leak a timing signal proportional to how many leading characters match,
// which defeats the point of signing the payload in the first place.
function signaturesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function verifyFathomSignature(
  rawBody: string,
  webhookId: string | null,
  webhookTimestamp: string | null,
  webhookSignature: string | null
): boolean {
  const secret = process.env.FATHOM_WEBHOOK_SECRET;
  if (!secret || !webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }
  if (!secret.startsWith("whsec_")) return false;

  const timestampSeconds = Number(webhookTimestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  // Replay protection: reject anything more than 5 minutes old (or from
  // the future, which would only happen on clock skew/forgery).
  const nowSeconds = Date.now() / 1000;
  if (Math.abs(nowSeconds - timestampSeconds) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const signingKey = Buffer.from(secret.slice("whsec_".length), "base64");
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", signingKey)
    .update(signedContent)
    .digest("base64");

  // Fathom may send multiple `v1,<sig>` tokens (space-delimited) during key
  // rotation — a match on any one of them is valid.
  const candidates = webhookSignature.split(" ").filter(Boolean);
  return candidates.some((candidate) => {
    const [version, value] = candidate.split(",");
    if (version !== "v1" || !value) return false;
    return signaturesMatch(expected, value);
  });
}

// --- Defensive payload parsing ---
//
// ASSUMED, not confirmed against real Fathom docs (their "New meeting
// content ready" payload shape wasn't fully documented): field names below
// and their nesting under `meeting`/`recording`/`default_summary`/`summary`.
// Every read here is optional-chained with fallbacks, and any shape we
// can't parse is logged (not thrown) so Fathom doesn't retry forever on a
// shape we'll never be able to handle.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const s = asString(value);
    if (s) return s;
  }
  return undefined;
}

type ParsedInvitee = { displayName?: string };

function extractInvitees(payload: Record<string, unknown>): ParsedInvitee[] {
  const meeting = isRecord(payload.meeting) ? payload.meeting : undefined;
  const raw =
    payload.calendar_invitees ??
    payload.invitees ??
    payload.participants ??
    meeting?.calendar_invitees ??
    meeting?.invitees ??
    meeting?.participants;

  if (!Array.isArray(raw)) return [];

  return raw.map((entry) => {
    if (!isRecord(entry)) return {};
    const displayName = firstString(entry.name, entry.email);
    return { displayName };
  });
}

function extractSummaryText(payload: Record<string, unknown>): string | undefined {
  const meeting = isRecord(payload.meeting) ? payload.meeting : undefined;
  const recording = isRecord(payload.recording) ? payload.recording : undefined;

  const candidates = [
    payload.default_summary,
    payload.summary,
    meeting?.default_summary,
    meeting?.summary,
    recording?.default_summary,
    recording?.summary,
  ];

  for (const candidate of candidates) {
    // Summary may be a plain string, or an object with a text/markdown body.
    const direct = asString(candidate);
    if (direct) return direct;
    if (isRecord(candidate)) {
      const nested = firstString(
        candidate.markdown_formatted,
        candidate.markdown,
        candidate.text,
        candidate.body
      );
      if (nested) return nested;
    }
  }
  return undefined;
}

type ParsedMeeting = {
  fathomId?: string;
  title?: string;
  url?: string;
  date?: string;
  invitees: ParsedInvitee[];
  summaryText?: string;
};

function parseFathomPayload(payload: unknown): ParsedMeeting | null {
  if (!isRecord(payload)) return null;

  const meeting = isRecord(payload.meeting) ? payload.meeting : undefined;
  const recording = isRecord(payload.recording) ? payload.recording : undefined;

  const fathomId = firstString(
    payload.recording_id,
    payload.id,
    recording?.id,
    recording?.recording_id,
    meeting?.id,
    meeting?.recording_id
  );

  const title = firstString(
    payload.title,
    payload.meeting_title,
    meeting?.title,
    recording?.title
  );

  const url = firstString(
    payload.url,
    payload.share_url,
    recording?.url,
    recording?.share_url,
    meeting?.url,
    meeting?.share_url
  );

  const date = firstString(
    payload.created_at,
    payload.recording_start_time,
    recording?.created_at,
    recording?.recording_start_time,
    meeting?.created_at,
    meeting?.start_time
  );

  return {
    fathomId,
    title,
    url,
    date,
    invitees: extractInvitees(payload),
    summaryText: extractSummaryText(payload),
  };
}

export async function POST(request: Request) {
  // Raw body text MUST be read before any JSON.parse — the signature is
  // computed over the exact bytes Fathom sent, and a re-serialized JSON
  // body will not byte-match even if it's semantically identical.
  const rawBody = await request.text();

  const verified = verifyFathomSignature(
    rawBody,
    request.headers.get("webhook-id"),
    request.headers.get("webhook-timestamp"),
    request.headers.get("webhook-signature")
  );

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("Fathom webhook: body was not valid JSON", err);
    return NextResponse.json({ received: true, parsed: false }, { status: 200 });
  }

  const parsed = parseFathomPayload(payload);
  if (
    !parsed ||
    !parsed.fathomId ||
    !parsed.title ||
    !parsed.url
  ) {
    console.error(
      "Fathom webhook: could not extract required fields (recording id/title/url) from payload",
      payload
    );
    return NextResponse.json({ received: true, parsed: false }, { status: 200 });
  }

  const fathomIdNumber = Number(parsed.fathomId);
  if (!Number.isFinite(fathomIdNumber)) {
    console.error(
      `Fathom webhook: recording id "${parsed.fathomId}" is not numeric`
    );
    return NextResponse.json({ received: true, parsed: false }, { status: 200 });
  }

  const supabase = supabaseServer();

  const { data: clientsData, error: clientsError } = await supabase
    .from("clients")
    .select("id, name");
  const clients = clientsData as { id: string; name: string }[] | null;

  if (clientsError || !clients) {
    console.error("Fathom webhook: failed to load clients", clientsError);
    return NextResponse.json({ received: true, matched: false }, { status: 200 });
  }

  const inviteeNames = parsed.invitees
    .map((i) => i.displayName)
    .filter((n): n is string => !!n)
    .map((n) => n.toLowerCase());

  // v1 matching: does a client's name appear as a case-insensitive
  // substring of any invitee's display name? This is deliberately naive —
  // no email matching, no fuzzy matching — because Fathom's payload
  // doesn't reliably give us a stable client identifier (no stored client
  // email to match against yet). If this ever misfires (wrong match, or a
  // client's first name colliding with another invitee), the natural next
  // step is matching by invitee email against a `clients.email` column
  // instead of by name substring.
  const matches = clients.filter((client) =>
    inviteeNames.some((name) => name.includes(client.name.toLowerCase()))
  );

  if (matches.length !== 1) {
    console.warn(
      `Fathom webhook: meeting "${parsed.title}" (fathom_id ${fathomIdNumber}) matched ${matches.length} clients, expected exactly 1. Invitees: ${JSON.stringify(inviteeNames)}`
    );
    return NextResponse.json({ received: true, matched: false }, { status: 200 });
  }

  const client = matches[0];

  // session_number and purpose are left null — there's no reliable way to
  // derive either automatically, and the sessions page already renders
  // both fields gracefully when null.
  const row = {
    client_id: client.id,
    fathom_id: fathomIdNumber,
    fathom_url: parsed.url,
    // Fall back to "now" if Fathom didn't send a parseable date — better
    // than dropping a real session, though this is an approximation.
    date: parsed.date ?? new Date().toISOString(),
    title: parsed.title,
    session_number: null,
    purpose: null,
    summary_md: parsed.summaryText ?? null,
  };

  const { error: upsertError } = await supabase
    .from("sessions")
    .upsert([row] as never, { onConflict: "fathom_id" });

  if (upsertError) {
    console.error("Fathom webhook: session upsert failed", upsertError);
    return NextResponse.json({ received: true, matched: true, saved: false }, { status: 200 });
  }

  return NextResponse.json({ received: true, matched: true, saved: true }, { status: 200 });
}
