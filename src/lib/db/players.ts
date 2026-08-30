import "server-only";
import { dbError } from "@/lib/db/error";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Player } from "@/types/db";

/**
 * The column is a uuid, so anything else is not a token that could ever have
 * been issued — and handing Postgres a malformed one is a 500 rather than the
 * "no such player" it actually is. Junk in the header is a stranger poking at
 * the endpoint; answer it like the unknown player it is.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPlayerByToken(clientToken: string): Promise<Player | null> {
  if (!UUID_RE.test(clientToken)) return null;
  const { data, error } = await supabaseAdmin()
    .from("players")
    .select("*")
    .eq("client_token", clientToken)
    .maybeSingle();
  if (error) throw dbError(error, "players");
  return (data as Player) ?? null;
}

export async function createPlayer(name: string, clientToken: string): Promise<Player> {
  const { data, error } = await supabaseAdmin()
    .from("players")
    .insert({ name: name.trim().slice(0, 60), client_token: clientToken })
    .select("*")
    .single();
  if (error) throw dbError(error, "players");
  return data as Player;
}

/** Wipes every player (and their guesses, via cascade). Babies/photos are untouched. */
export async function deleteAllPlayers(): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("players")
    .delete()
    .not("id", "is", null);
  if (error) throw dbError(error, "players");
}
