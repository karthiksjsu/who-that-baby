import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getPlayerByToken } from "@/lib/db/players";
import { getGameSettings } from "@/lib/db/settings";
import { clampResponseTime, scoreGuess } from "@/lib/game/scoring";
import { TIMED_OUT_GUESS } from "@/lib/game/constants";
import { broadcast } from "@/lib/realtime/broadcast";
import { LEADERBOARD_CHANNEL, LEADERBOARD_EVENT } from "@/lib/realtime/channels";
import type { GameRound } from "@/types/db";

/** Case/whitespace-insensitive so "priya sharma" matches "Priya Sharma". */
function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export const POST = apiRoute(async (request) => {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.client_token === "string" ? body.client_token : "";
  const babyId = typeof body.baby_id === "string" ? body.baby_id : "";
  const round: GameRound = body.round === "bonus" ? "bonus" : "choice";
  const guessedName = typeof body.guessed_name === "string" ? body.guessed_name.trim() : "";
  const responseTimeMs = clampResponseTime(Number(body.response_time_ms));
  // The clock ran out before the player picked anything. Recorded as a miss so
  // waiting a card out is never cheaper than guessing.
  const timedOut = body.timed_out === true;

  if (!token || !babyId || (!guessedName && !timedOut)) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const settings = await getGameSettings();
  if (settings.status !== "live") {
    return NextResponse.json({ error: "Game is not live." }, { status: 403 });
  }

  const player = await getPlayerByToken(token);
  if (!player) {
    return NextResponse.json({ error: "Unknown player." }, { status: 404 });
  }

  const client = supabaseAdmin();
  const { data: baby, error: babyError } = await client
    .from("babies")
    .select("id, correct_name")
    .eq("id", babyId)
    .maybeSingle();
  if (babyError) throw babyError;
  if (!baby) {
    return NextResponse.json({ error: "Unknown baby." }, { status: 404 });
  }

  const isCorrect = timedOut ? false : normalize(baby.correct_name) === normalize(guessedName);
  const points = scoreGuess(isCorrect, responseTimeMs);

  const { data: inserted, error: insertError } = await client
    .from("guesses")
    .insert({
      player_id: player.id,
      baby_id: babyId,
      round,
      guessed_name: timedOut ? TIMED_OUT_GUESS : guessedName,
      is_correct: isCorrect,
      points,
      response_time_ms: responseTimeMs,
    })
    .select("*")
    .single();

  if (insertError) {
    // Unique (player_id, baby_id, round) violation = already answered this card this round.
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Already answered." }, { status: 409 });
    }
    throw insertError;
  }

  await broadcast(LEADERBOARD_CHANNEL, LEADERBOARD_EVENT, { player_id: player.id });

  return NextResponse.json({
    is_correct: isCorrect,
    points,
    correct_name: baby.correct_name,
    guess: inserted,
  });
});
