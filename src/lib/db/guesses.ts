import "server-only";
import { dbError } from "@/lib/db/error";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Guess, GameRound, LeaderboardRow } from "@/types/db";

export async function getGuessesForPlayer(playerId: string, round: GameRound): Promise<Guess[]> {
  const { data, error } = await supabaseAdmin()
    .from("guesses")
    .select("*")
    .eq("player_id", playerId)
    .eq("round", round);
  if (error) throw dbError(error, "guesses");
  return data as Guess[];
}

export async function insertGuess(input: {
  player_id: string;
  baby_id: string;
  round: GameRound;
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
  if (error) throw dbError(error, "guesses");
  return data as Guess;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabaseAdmin().from("leaderboard").select("*");
  if (error) throw dbError(error, "guesses");
  return data as LeaderboardRow[];
}
