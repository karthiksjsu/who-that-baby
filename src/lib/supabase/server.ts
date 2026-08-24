import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-side route handlers only. This bypasses RLS,
 * which is intentional: babies/players/guesses have no anon policies, so all
 * reads/writes go through API routes using this client.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
