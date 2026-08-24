import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Guess, LeaderboardRow } from "@/types/db";

export async function getGuessesForPlayer(playerId: string): Promise<Guess[]> {
  const { data, error } = await supabaseAdmin()
    .from("guesses")
    .select("*")
    .eq("player_id", playerId);
  if (error) throw error;
  return data as Guess[];
}

export async function insertGuess(input: {
  player_id: string;
  baby_id: string;
  guessed_name: string;
  is_correct: boolean;
  points: number;
  response_time_ms: number;
}): Promise<Guess> {
  const { data, error } = await supabaseAdmin()
    .from("guesses")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as Guess;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabaseAdmin().from("leaderboard").select("*");
  if (error) throw error;
  return data as LeaderboardRow[];
}
