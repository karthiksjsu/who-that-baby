import "server-only";
import { dbError } from "@/lib/db/error";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Player } from "@/types/db";

export async function getPlayerByToken(clientToken: string): Promise<Player | null> {
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
