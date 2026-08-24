import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getClientByToken } from "@/lib/data";

export async function POST(request: Request) {
  let token: unknown;
  let title: unknown;
  try {
    const body = await request.json();
    token = body?.token;
    title = body?.title;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Missing title." }, { status: 400 });
  }

  const client = await getClientByToken(token);
  if (!client) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      client_id: client.id,
      title: title.trim(),
      status: "open",
      assigned_date: new Date().toISOString().slice(0, 10),
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }

  return NextResponse.json({ id: (data as { id: string }).id });
}
