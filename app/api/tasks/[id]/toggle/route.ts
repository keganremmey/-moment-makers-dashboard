import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// This is the only write path in the whole app, and there is no session or
// cookie auth anywhere else — the per-client access_token IS the
// credential. So every write re-verifies the token server-side against the
// task's own client, on every request, regardless of what the UI already
// checked.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/tasks/[id]/toggle">
) {
  const { id } = await ctx.params;

  let token: unknown;
  try {
    const body = await request.json();
    token = body?.token;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }

  const supabase = supabaseServer();

  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .select("id, status, client_id")
    .eq("id", id)
    .maybeSingle();
  const task = taskData as { id: string; status: string; client_id: string } | null;

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select("id, access_token")
    .eq("id", task.client_id)
    .maybeSingle();
  const client = clientData as { id: string; access_token: string } | null;

  if (clientError || !client || client.access_token !== token) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const nextStatus = task.status === "done" ? "open" : "done";

  // The Supabase client has no Database type generic (this app has no
  // `supabase gen types` step), so the update payload is typed loosely
  // here rather than inferred as `never`.
  const { data: updatedData, error: updateError } = await supabase
    .from("tasks")
    .update({ status: nextStatus, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select("id, status")
    .single();
  const updated = updatedData as { id: string; status: string } | null;

  if (updateError || !updated) {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ status: updated.status });
}
