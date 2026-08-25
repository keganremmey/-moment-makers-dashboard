import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getClientByToken } from "@/lib/data";

// Marks a checkpoint day as celebrated so the big burst never replays for
// the same milestone. Only ever moves the marker forward: a stale or
// replayed request with an older day than what's already stored is a
// no-op, never a regression.
export async function POST(request: Request) {
  let token: unknown;
  let day: unknown;
  try {
    const body = await request.json();
    token = body?.token;
    day = body?.day;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }

  if (typeof day !== "number" || !Number.isFinite(day)) {
    return NextResponse.json({ error: "Missing day." }, { status: 400 });
  }

  const client = await getClientByToken(token);
  if (!client) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (day <= client.last_celebrated_checkpoint_day) {
    return NextResponse.json({ last_celebrated_checkpoint_day: client.last_celebrated_checkpoint_day });
  }

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("clients")
    .update({ last_celebrated_checkpoint_day: day } as never)
    .eq("id", client.id);

  if (error) {
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }

  return NextResponse.json({ last_celebrated_checkpoint_day: day });
}
