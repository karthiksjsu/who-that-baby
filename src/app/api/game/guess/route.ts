import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getPlayerByToken } from "@/lib/db/players";
import { getGameSettings } from "@/lib/db/settings";
import { clampResponseTime, scoreGuess } from "@/lib/game/scoring";
import { broadcast } from "@/lib/realtime/broadcast";
import { LEADERBOARD_CHANNEL, LEADERBOARD_EVENT } from "@/lib/realtime/channels";

export const POST = apiRoute(async (request) => {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.client_token === "string" ? body.client_token : "";
  const babyId = typeof body.baby_id === "string" ? body.baby_id : "";
  const guessedName = typeof body.guessed_name === "string" ? body.guessed_name.trim() : "";
  const responseTimeMs = clampResponseTime(Number(body.response_time_ms));

  if (!token || !babyId || !guessedName) {
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

  const isCorrect = baby.correct_name === guessedName;
  const points = scoreGuess(isCorrect, responseTimeMs);

  const { data: inserted, error: insertError } = await client
    .from("guesses")
    .insert({
      player_id: player.id,
      baby_id: babyId,
      guessed_name: guessedName,
      is_correct: isCorrect,
      points,
      response_time_ms: responseTimeMs,
    })
    .select("*")
    .single();

  if (insertError) {
    // Unique (player_id, baby_id) violation = already answered this card.
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
