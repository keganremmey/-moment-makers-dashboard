import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key. This must never be
// imported from a Client Component or anything that ships to the browser —
// it bypasses Row Level Security entirely. There is no anon/publishable key
// in this app: RLS is default-deny on every table, so the service role is
// the only way in, and access control lives in application code (the
// per-client access_token) instead of Postgres policies.

let cached: ReturnType<typeof createClient> | null = null;

export function supabaseServer() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false },
  });

  return cached;
}
