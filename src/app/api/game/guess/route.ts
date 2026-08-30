import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listBabies } from "@/lib/db/babies";
import { getPlayerByToken } from "@/lib/db/players";
import { getGameSettings, positionOf } from "@/lib/db/settings";
import { clampResponseTime, scoreGuess } from "@/lib/game/scoring";
import { DEADLINE_GRACE_MS } from "@/lib/game/constants";
import { acceptsAnswers, deadlineMs } from "@/lib/game/schedule";
import { broadcast } from "@/lib/realtime/broadcast";
import { LEADERBOARD_CHANNEL, LEADERBOARD_EVENT } from "@/lib/realtime/channels";

/** Case/whitespace-insensitive so "priya sharma" matches "Priya Sharma". */
function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export const POST = apiRoute(async (request) => {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.client_token === "string" ? body.client_token : "";
  const babyId = typeof body.baby_id === "string" ? body.baby_id : "";
  // Capped at the same length a name can be, so the free-text round cannot be
  // used to push arbitrarily large strings into the table.
  const guessedName =
    typeof body.guessed_name === "string" ? body.guessed_name.trim().slice(0, 80) : "";

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

  // Everything below is decided from server state. The client says only which
  // name it picked; which card is live, which round it belongs to, and how long
  // the player took are all read here.
  const pos = positionOf(settings);
  if (!acceptsAnswers(pos)) {
    return NextResponse.json({ error: "Answers are closed." }, { status: 409 });
  }

  const babies = await listBabies(pos.round);
  const baby = babies[pos.index] ?? null;
  if (!baby) {
    return NextResponse.json({ error: "No card is live." }, { status: 409 });
  }
  if (baby.id !== babyId) {
    // A stale tab answering a card the room has already left.
    return NextResponse.json({ error: "That card has passed." }, { status: 409 });
  }

  const startedAt = settings.phase_started_at
    ? Date.parse(settings.phase_started_at)
    : null;
  const deadline = deadlineMs(pos.phase, startedAt);
  if (startedAt === null || deadline === null) {
    return NextResponse.json({ error: "No card is live." }, { status: 409 });
  }
  if (Date.now() > deadline + DEADLINE_GRACE_MS) {
    return NextResponse.json({ error: "Time's up for that card." }, { status: 409 });
  }

  // Measured server-side. A client that reported its own elapsed time could
  // simply claim zero and collect the full speed bonus every round.
  const responseTimeMs = clampResponseTime(Date.now() - startedAt);
  const isCorrect = normalize(baby.correct_name) === normalize(guessedName);
  const points = scoreGuess(isCorrect, responseTimeMs);

  const { data: inserted, error: insertError } = await supabaseAdmin()
    .from("guesses")
    .insert({
      player_id: player.id,
      baby_id: baby.id,
      round: pos.round,
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

  // Note what is NOT returned: whether they were right, and the correct name.
  // Both are withheld until the reveal so nobody can read the answer off a
  // faster neighbour's phone. The client only learns it is locked in.
  return NextResponse.json({ locked_in: true, guess_id: inserted.id });
});
