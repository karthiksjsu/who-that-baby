"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Browser anon client. Used only for Realtime Broadcast subscriptions
 * (leaderboard/status updates) — never for reading/writing tables directly,
 * since babies/players/guesses have no anon RLS policies.
 */
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
    );
  }
  return createClient(url, key);
}
