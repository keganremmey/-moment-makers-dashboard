#!/usr/bin/env node
// iMessage relay for the Moment Makers texts page. Runs on Kegan's Mac.
//
// Every few seconds it:
//   1. reads new 1:1 texts from ~/Library/Messages/chat.db (read-only),
//   2. posts them to the dashboard, which drafts a reply with Claude,
//   3. asks the dashboard for replies Kegan approved, and sends each one
//      through the Messages app, from his own number.
//
// What never leaves the Mac: group chats, short codes (bank alerts, 2FA
// codes, delivery updates), tapbacks, attachments without text, and anyone
// Kegan muted on the texts page.
//
// Setup and the launchd file that keeps it running: docs/text-drafts.md.
// Needs only macOS's built-in sqlite3 and osascript, no npm packages.
//
//   node --env-file=$HOME/.moment-makers-relay/relay.env scripts/imessage-relay.mjs
//   add --dry-run to print what it would upload and send nothing.

import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const DASHBOARD_URL = (process.env.DASHBOARD_URL ?? "").replace(/\/$/, "");
const RELAY_TOKEN = process.env.TEXTS_RELAY_TOKEN ?? "";
const POLL_SECONDS = Number(process.env.POLL_SECONDS ?? 5);
const HISTORY = 20;
// Optional comma-separated allowlist. When set, only these handles are
// uploaded. Use it to start with a few clients before opening it up.
const ONLY = (process.env.TEXTS_ONLY_HANDLES ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);
const DRY_RUN = process.argv.includes("--dry-run");

const DB = join(homedir(), "Library", "Messages", "chat.db");
const STATE_DIR = join(homedir(), ".moment-makers-relay");
const STATE_FILE = join(STATE_DIR, "state.json");

const APPLE_EPOCH_MS = Date.UTC(2001, 0, 1);
const ONE_TO_ONE_STYLE = 45;

if (!DRY_RUN && (!DASHBOARD_URL || !RELAY_TOKEN)) {
  console.error("Set DASHBOARD_URL and TEXTS_RELAY_TOKEN (see docs/text-drafts.md).");
  process.exit(1);
}

function log(...args) {
  console.log(new Date().toLocaleTimeString(), ...args);
}

// ---------- Messages database ----------

async function sqlite(query) {
  const { stdout } = await run("sqlite3", ["-readonly", "-json", DB, query], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout.trim() ? JSON.parse(stdout) : [];
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Apple stores dates as nanoseconds (older macOS: seconds) since 2001-01-01.
function appleDateToIso(value) {
  const n = Number(value);
  const seconds = n > 1e12 ? n / 1e9 : n;
  return new Date(APPLE_EPOCH_MS + seconds * 1000).toISOString();
}

// Since macOS Ventura, many messages keep their text only in attributedBody,
// an NSKeyedArchiver "typedstream". The string sits after the NSString class
// marker: a '+' byte, a length (one byte, or 0x81 + uint16, or 0x82 +
// uint32, little-endian), then UTF-8 bytes.
function decodeAttributedBody(hex) {
  if (!hex) return null;
  const buf = Buffer.from(hex, "hex");
  const marker = buf.indexOf("NSString");
  if (marker === -1) return null;
  let pos = buf.indexOf(0x2b, marker + "NSString".length);
  if (pos === -1) return null;
  pos += 1;
  let length = buf[pos];
  if (length === 0x81) {
    length = buf.readUInt16LE(pos + 1);
    pos += 3;
  } else if (length === 0x82) {
    length = buf.readUInt32LE(pos + 1);
    pos += 5;
  } else {
    pos += 1;
  }
  if (pos + length > buf.length) return null;
  return buf.subarray(pos, pos + length).toString("utf8");
}

// A real person: an email, or a phone number with at least 10 digits.
// Short codes (5-6 digits) are businesses and 2FA senders.
function isPersonHandle(handle) {
  if (!handle) return false;
  if (handle.includes("@")) return true;
  return handle.replace(/\D/g, "").length >= 10;
}

const SELECT = `
  SELECT m.ROWID AS rowid, m.guid, m.text, hex(m.attributedBody) AS ab,
         m.is_from_me, m.date, c.guid AS chat_guid, c.chat_identifier AS handle,
         c.style AS chat_style
  FROM message m
  JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
  JOIN chat c ON c.ROWID = cmj.chat_id
  WHERE m.associated_message_type = 0 AND m.item_type = 0`;

function toMessage(row) {
  // Messages uses U+FFFC as the placeholder for an attachment.
  const raw = row.text ?? decodeAttributedBody(row.ab) ?? "";
  const body = raw.replace(/￼/g, "").trim();
  if (!body) return null;
  return {
    guid: row.guid,
    handle: row.handle,
    chat_guid: row.chat_guid,
    is_from_me: row.is_from_me === 1,
    body,
    sent_at: appleDateToIso(row.date),
  };
}

// ---------- State ----------

function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function saveState(state) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

// ---------- Dashboard ----------

async function api(path, init = {}) {
  const res = await fetch(`${DASHBOARD_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${RELAY_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json();
}

// ---------- Sending ----------

// Text and handle go in as argv, never spliced into the script, so nothing
// in a message can change what AppleScript runs.
const SEND_TO_CHAT = `on run argv
  tell application "Messages" to send (item 2 of argv) to chat id (item 1 of argv)
end run`;

const SEND_TO_PARTICIPANT = `on run argv
  tell application "Messages"
    set svc to 1st account whose service type = iMessage
    send (item 2 of argv) to participant (item 1 of argv) of svc
  end tell
end run`;

async function sendText(item) {
  if (item.chat_guid) {
    try {
      await run("osascript", ["-e", SEND_TO_CHAT, item.chat_guid, item.text]);
      return;
    } catch (err) {
      log("chat id send failed, trying by handle:", err.message.split("\n")[0]);
    }
  }
  await run("osascript", ["-e", SEND_TO_PARTICIPANT, item.handle, item.text]);
}

// ---------- Loop ----------

let ignore = new Set();

async function pullNewTexts(state) {
  const rows = await sqlite(`${SELECT} AND m.ROWID > ${Number(state.lastRowid)} ORDER BY m.ROWID LIMIT 300`);
  if (rows.length === 0) return;
  const maxRowid = Math.max(...rows.map((r) => r.rowid));

  const keep = rows.filter(
    (r) =>
      r.chat_style === ONE_TO_ONE_STYLE &&
      isPersonHandle(r.handle) &&
      !ignore.has(r.handle) &&
      (ONLY.length === 0 || ONLY.includes(r.handle))
  );

  const messages = keep.map(toMessage).filter(Boolean);
  // For chats with a new incoming text, include recent history so the
  // drafter can see the conversation. The server drops duplicates.
  const chatsWithInbound = [...new Set(messages.filter((m) => !m.is_from_me).map((m) => m.chat_guid))];
  for (const chatGuid of chatsWithInbound) {
    const history = await sqlite(
      `${SELECT} AND c.guid = ${sqlString(chatGuid)} AND m.ROWID <= ${maxRowid} ORDER BY m.date DESC LIMIT ${HISTORY}`
    );
    messages.push(...history.map(toMessage).filter(Boolean));
  }

  const unique = [...new Map(messages.map((m) => [m.guid, m])).values()];
  messages.length = 0;
  messages.push(...unique);

  if (messages.length > 0) {
    if (DRY_RUN) {
      for (const m of messages) log(m.is_from_me ? "me ->" : `${m.handle} ->`, m.body.slice(0, 80));
    } else {
      const result = await api("/api/texts/inbound", {
        method: "POST",
        body: JSON.stringify({ messages }),
      });
      if (result.stored > 0) log(`uploaded ${result.stored} new, drafting ${result.drafting}`);
    }
  }

  // Only move forward once the upload succeeded, so a dashboard outage
  // means a retry next tick, never a lost text.
  state.lastRowid = maxRowid;
  if (!DRY_RUN) saveState(state);
}

async function sendApproved() {
  const { outbox, ignore: muted } = await api("/api/texts/relay");
  ignore = new Set(muted);
  if (outbox.length === 0) return;

  const results = [];
  for (const item of outbox) {
    try {
      await sendText(item);
      results.push({ id: item.id, ok: true });
      log(`sent to ${item.handle}`);
    } catch (err) {
      const error = (err.stderr || err.message || "Send failed").toString().split("\n")[0];
      results.push({ id: item.id, ok: false, error });
      log(`send to ${item.handle} failed:`, error);
    }
  }
  await api("/api/texts/relay", { method: "POST", body: JSON.stringify({ results }) });
}

async function main() {
  let state = loadState();
  if (!state) {
    // First run: start from now instead of uploading years of history.
    const [{ max }] = await sqlite("SELECT COALESCE(MAX(ROWID), 0) AS max FROM message");
    state = { lastRowid: max };
    if (!DRY_RUN) saveState(state);
    log(`first run, watching for texts after message #${max}`);
  }
  if (DRY_RUN) {
    state.lastRowid = Math.max(0, state.lastRowid - 50);
    log("dry run: printing the last ~50 messages that would upload, sending nothing");
  }

  log(`relay running, checking every ${POLL_SECONDS}s`);
  for (;;) {
    try {
      if (!DRY_RUN) await sendApproved();
      await pullNewTexts(state);
      if (DRY_RUN) return;
    } catch (err) {
      const msg = String(err.message ?? err);
      if (msg.includes("authorization denied") || msg.includes("unable to open database")) {
        log("Can't read Messages. Give your terminal (or node) Full Disk Access: docs/text-drafts.md");
      } else {
        log("error:", msg.split("\n")[0]);
      }
    }
    await new Promise((r) => setTimeout(r, POLL_SECONDS * 1000));
  }
}

main();
