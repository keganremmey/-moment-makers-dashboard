#!/usr/bin/env node
// Seeds (or updates) one client's dashboard data from a seed JSON file.
//
// Usage:
//   node --env-file=.env.local scripts/seed.mjs
//   (or export SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY yourself first)
//
// Safe to re-run: every table is upserted on a natural unique key, and the
// client's access_token is generated once and never overwritten. Tasks are
// matched by (client, title, assigned_date) and never have their `status`
// field touched on an update, so a client's own progress in the app (ticking
// a task done) survives a reseed.

import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment."
  );
  process.exit(1);
}

const seedPath = path.join(__dirname, "..", "seed", "ian-lynch.json");
const seedArgPath = process.argv[2];
const finalSeedPath = seedArgPath ? path.resolve(seedArgPath) : seedPath;

const seed = JSON.parse(await readFile(finalSeedPath, "utf8"));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function generateAccessToken() {
  // ~32 characters, URL-safe.
  return randomBytes(24).toString("base64url");
}

async function upsertClient(clientSeed) {
  const { data: existing, error: selectError } = await supabase
    .from("clients")
    .select("id, access_token")
    .eq("slug", clientSeed.slug)
    .maybeSingle();

  if (selectError) throw selectError;

  const fields = {
    slug: clientSeed.slug,
    name: clientSeed.name,
    program: clientSeed.program ?? null,
    identity_names: clientSeed.identity_names ?? [],
    default_self_names: clientSeed.default_self_names ?? [],
    north_star: clientSeed.north_star ?? null,
    accent_hex: clientSeed.accent_hex ?? null,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("clients")
      .update(fields)
      .eq("id", existing.id)
      .select("id, access_token")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...fields, access_token: generateAccessToken() })
    .select("id, access_token")
    .single();
  if (error) throw error;
  return data;
}

async function upsertSessions(clientId, sessions) {
  if (sessions.length === 0) return;
  const rows = sessions.map((s) => ({
    client_id: clientId,
    fathom_id: s.fathom_id,
    fathom_url: s.fathom_url,
    date: s.date,
    title: s.title,
    session_number: s.session_number ?? null,
    purpose: s.purpose ?? null,
    summary_md: s.summary_md ?? null,
  }));

  const { error } = await supabase
    .from("sessions")
    .upsert(rows, { onConflict: "fathom_id" });
  if (error) throw error;
}

async function upsertWins(clientId, wins) {
  if (wins.length === 0) return;
  const rows = wins.map((w) => ({
    client_id: clientId,
    date: w.date,
    title: w.title,
    description: w.description ?? null,
    source_session_fathom_id: w.source_session ?? null,
  }));

  const { error } = await supabase
    .from("wins")
    .upsert(rows, { onConflict: "client_id,date,title" });
  if (error) throw error;
}

async function upsertTasks(clientId, tasks) {
  for (const t of tasks) {
    const assignedDate = t.assigned_date ?? null;

    let query = supabase
      .from("tasks")
      .select("id")
      .eq("client_id", clientId)
      .eq("title", t.title);
    query =
      assignedDate === null
        ? query.is("assigned_date", null)
        : query.eq("assigned_date", assignedDate);

    const { data: existing, error: selectError } = await query.maybeSingle();
    if (selectError) throw selectError;

    if (existing) {
      // Never touch `status` here — that's the client's own progress.
      const { error } = await supabase
        .from("tasks")
        .update({
          note: t.note ?? null,
          source_session_fathom_id: t.source_session ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("tasks").insert({
        client_id: clientId,
        title: t.title,
        note: t.note ?? null,
        status: t.status ?? "open",
        assigned_date: assignedDate,
        source_session_fathom_id: t.source_session ?? null,
      });
      if (error) throw error;
    }
  }
}

async function upsertSkills(skills) {
  if (skills.length === 0) return new Map();
  const rows = skills.map((s) => ({
    slug: s.slug,
    name: s.name,
    description: s.description ?? null,
  }));

  const { error } = await supabase
    .from("skills")
    .upsert(rows, { onConflict: "slug" });
  if (error) throw error;

  const { data, error: selectError } = await supabase
    .from("skills")
    .select("id, slug");
  if (selectError) throw selectError;

  return new Map(data.map((row) => [row.slug, row.id]));
}

async function upsertSkillReps(clientId, skillReps, skillIdBySlug) {
  if (skillReps.length === 0) return;
  const rows = skillReps
    .map((r) => {
      const skillId = skillIdBySlug.get(r.skill_slug);
      if (!skillId) {
        console.warn(`Skipping rep for unknown skill slug "${r.skill_slug}"`);
        return null;
      }
      return {
        client_id: clientId,
        skill_id: skillId,
        date: r.date,
        note: r.note ?? null,
        source_session_fathom_id: r.source_session ?? null,
      };
    })
    .filter(Boolean);

  const { error } = await supabase
    .from("skill_reps")
    .upsert(rows, { onConflict: "client_id,skill_id,date,note" });
  if (error) throw error;
}

async function upsertFrameworks(frameworks) {
  if (frameworks.length === 0) return;
  const rows = frameworks.map((f) => ({
    slug: f.slug,
    name: f.name,
    summary: f.summary ?? null,
    steps: f.steps ?? [],
    source_session_fathom_id: f.source_session ?? null,
  }));

  const { error } = await supabase
    .from("frameworks")
    .upsert(rows, { onConflict: "slug" });
  if (error) throw error;
}

async function upsertQuotes(clientId, quotes) {
  if (quotes.length === 0) return;
  const rows = quotes.map((q) => ({
    text: q.text,
    attributed_to: q.attributed_to ?? null,
    context: q.context ?? null,
    source_session_fathom_id: q.source_session ?? null,
    client_id: clientId,
  }));

  const { error } = await supabase
    .from("quotes")
    .upsert(rows, { onConflict: "text,source_session_fathom_id" });
  if (error) throw error;
}

async function main() {
  const client = await upsertClient(seed.client);
  await upsertSessions(client.id, seed.sessions ?? []);
  await upsertWins(client.id, seed.wins ?? []);
  await upsertTasks(client.id, seed.tasks ?? []);
  const skillIdBySlug = await upsertSkills(seed.skills ?? []);
  await upsertSkillReps(client.id, seed.skill_reps ?? [], skillIdBySlug);
  await upsertFrameworks(seed.frameworks ?? []);
  await upsertQuotes(client.id, seed.quotes ?? []);

  if (Array.isArray(seed.notes_for_builder) && seed.notes_for_builder.length) {
    console.log("\nnotes_for_builder (from seed file):");
    for (const note of seed.notes_for_builder) {
      console.log(`  - ${note}`);
    }
  }

  console.log("\nSeed complete.");
  console.log(`Dashboard URL path: /d/${client.access_token}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
