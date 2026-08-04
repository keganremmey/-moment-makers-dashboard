import { cache } from "react";
import { supabaseServer } from "@/lib/supabase-server";

export type Client = {
  id: string;
  slug: string;
  name: string;
  program: string | null;
  identity_names: string[];
  default_self_names: string[];
  north_star: string | null;
  accent_hex: string | null;
  access_token: string;
  created_at: string;
};

export type Session = {
  id: string;
  client_id: string;
  fathom_id: number;
  fathom_url: string;
  date: string;
  title: string;
  session_number: number | null;
  purpose: string | null;
  summary_md: string | null;
  created_at: string;
};

export type Win = {
  id: string;
  client_id: string;
  date: string;
  title: string;
  description: string | null;
  source_session_fathom_id: number | null;
  created_at: string;
};

export type Task = {
  id: string;
  client_id: string;
  title: string;
  note: string | null;
  status: "open" | "done" | "slipped";
  assigned_date: string | null;
  source_session_fathom_id: number | null;
  created_at: string;
  updated_at: string;
};

export type Skill = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type SkillRep = {
  id: string;
  client_id: string;
  skill_id: string;
  date: string;
  note: string | null;
  source_session_fathom_id: number | null;
  created_at: string;
};

export type Framework = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  steps: string[];
  source_session_fathom_id: number | null;
};

export type Quote = {
  id: string;
  text: string;
  attributed_to: string | null;
  context: string | null;
  source_session_fathom_id: number | null;
  client_id: string | null;
};

/** Look up a client by their access token (the entire auth mechanism — a
 * long random string in the URL path). Returns null if no match.
 * Wrapped in React `cache()` so every page/layout under /d/[token] that
 * calls this during the same request shares one lookup instead of hitting
 * Supabase repeatedly for the same render. */
export const getClientByToken = cache(async function getClientByToken(
  token: string
): Promise<Client | null> {
  if (!token) return null;

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (error) {
    console.error("getClientByToken error", error);
    return null;
  }

  return data as Client | null;
});

export async function getSessions(clientId: string): Promise<Session[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false });

  if (error) {
    console.error("getSessions error", error);
    return [];
  }

  return (data as Session[]) ?? [];
}

export async function getWins(clientId: string): Promise<Win[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("wins")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false });

  if (error) {
    console.error("getWins error", error);
    return [];
  }

  return (data as Win[]) ?? [];
}

export async function getTasks(clientId: string): Promise<Task[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("client_id", clientId)
    .order("assigned_date", { ascending: false });

  if (error) {
    console.error("getTasks error", error);
    return [];
  }

  return (data as Task[]) ?? [];
}

export async function getSkills(): Promise<Skill[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("getSkills error", error);
    return [];
  }

  return (data as Skill[]) ?? [];
}

export async function getSkillReps(clientId: string): Promise<SkillRep[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("skill_reps")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false });

  if (error) {
    console.error("getSkillReps error", error);
    return [];
  }

  return (data as SkillRep[]) ?? [];
}

export async function getFrameworks(): Promise<Framework[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("frameworks")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("getFrameworks error", error);
    return [];
  }

  return (data as Framework[]) ?? [];
}

export async function getQuotes(clientId: string): Promise<Quote[]> {
  // Deliberately client-scoped only, even though `quotes.client_id` is
  // nullable in the schema (a future "shared coaching wisdom" quote could
  // exist with no client). Matching on `client_id.is.null` here would mean
  // a quote someone adds directly in Supabase Studio without setting
  // client_id — meant privately for one client — silently appears on every
  // client's dashboard. If a genuinely shared quote is ever wanted, that
  // should be an explicit opt-in, not a fallback of "forgot to set a field."
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("client_id", clientId);

  if (error) {
    console.error("getQuotes error", error);
    return [];
  }

  return (data as Quote[]) ?? [];
}
