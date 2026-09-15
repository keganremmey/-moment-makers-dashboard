import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getClientByToken } from "@/lib/data";

// One entry per quest per day, the app's version of the daily spine (one
// voice note a day, three lines). Upserts on (quest_id, log_date) so
// re-submitting today's log edits it in place rather than creating a second
// row for the same day.
export async function POST(request: Request) {
  let body: {
    token?: unknown;
    questId?: unknown;
    encounterId?: unknown;
    note?: unknown;
    score?: unknown;
    logDate?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { token, questId, encounterId, note, score, logDate } = body;

  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }
  if (typeof questId !== "string" || questId.length === 0) {
    return NextResponse.json({ error: "Missing questId." }, { status: 400 });
  }
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 4) {
    return NextResponse.json({ error: "Score must be an integer 0-4." }, { status: 400 });
  }

  const client = await getClientByToken(token);
  if (!client) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const supabase = supabaseServer();

  const { data: quest, error: questError } = await supabase
    .from("quests")
    .select("id")
    .eq("id", questId)
    .eq("client_id", client.id)
    .maybeSingle();

  if (questError || !quest) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("quest_logs")
    .upsert(
      {
        quest_id: questId,
        client_id: client.id,
        log_date: typeof logDate === "string" ? logDate : new Date().toISOString().slice(0, 10),
        encounter_id: typeof encounterId === "string" ? encounterId : null,
        note: typeof note === "string" ? note.slice(0, 1000) : null,
        score,
      } as never,
      { onConflict: "quest_id,log_date" }
    );

  if (error) {
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
