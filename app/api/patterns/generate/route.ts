import { NextResponse } from "next/server";
import { getClientByToken } from "@/lib/data";
import { refreshPatterns } from "@/lib/patterns-refresh";

export const maxDuration = 300;

/**
 * Manual/safety-net entry point for pattern regeneration.
 *
 * Patterns normally refresh on their own: the Fathom session webhook and the
 * journal upload route both call refreshPatterns() the moment new evidence
 * lands. This route exists for backfilling, for forcing a rewrite after a
 * prompt change, and as a recovery path if an automatic refresh errored.
 */
export async function POST(req: Request) {
  let body: { token?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { token, force } = body;
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const client = await getClientByToken(token);
  if (!client) {
    return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  }

  try {
    const result = await refreshPatterns(client.id, { force });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Pattern generation failed", err);
    return NextResponse.json({ error: "Pattern generation failed." }, { status: 500 });
  }
}
