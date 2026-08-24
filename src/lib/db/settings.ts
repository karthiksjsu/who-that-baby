import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { GameSettings } from "@/types/db";

export async function getGameSettings(): Promise<GameSettings> {
  const { data, error } = await supabaseAdmin()
    .from("game_settings")
    .select("status, winner_revealed, choices_count")
    .eq("id", true)
    .single();
  if (error) throw error;
  return data as GameSettings;
}

export async function updateGameSettings(
  patch: Partial<Pick<GameSettings, "status" | "winner_revealed" | "choices_count">>
): Promise<GameSettings> {
  const { data, error } = await supabaseAdmin()
    .from("game_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("status, winner_revealed, choices_count")
    .single();
  if (error) throw error;
  return data as GameSettings;
}
