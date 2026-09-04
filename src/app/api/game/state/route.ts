import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { listBabies } from "@/lib/db/babies";
import { getGuessesForPlayer } from "@/lib/db/guesses";
import { getPlayerByToken } from "@/lib/db/players";
import { getGameSettings, positionOf } from "@/lib/db/settings";
import { buildChoices } from "@/lib/game/distractors";
import { allocateDistractors } from "@/lib/game/allocation";
import { deadlineMs, phaseDurationMs, timingsOf } from "@/lib/game/schedule";
import type { LiveState } from "@/types/db";

/**
 * Never cache this. It is polled continuously and must always reflect the
 * database right now; a cached response leaves the room stuck on a stale phase
 * until someone reloads the page.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * One snapshot of the live game for a single player.
 *
 * Polled every couple of seconds and also refetched on a realtime nudge. It is
 * the only thing the player client trusts: the client never decides which card
 * is up, only renders what this returns.
 */
export const GET = apiRoute(async (request) => {
  // The token is the player's whole identity, so it travels in a header:
  // query strings end up in access logs, browser history and the screenshots
  // guests cheerfully send each other during a party. The `?token=` form is
  // still read because a phone that was mid-poll when this deployed is still
  // asking that way, and dropping it would freeze that guest's card until
  // they thought to reload.
  const url = new URL(request.url);
  const token =
    request.headers.get("x-player-token") ?? url.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const [player, settings] = await Promise.all([
    getPlayerByToken(token),
    getGameSettings(),
  ]);
  if (!player) {
    return NextResponse.json({ error: "Unknown player." }, { status: 404 });
  }

  const pos = positionOf(settings);
  const babies = await listBabies(pos.round);
  const startedAt = settings.phase_started_at
    ? Date.parse(settings.phase_started_at)
    : null;

  const baby =
    pos.phase === "question" || pos.phase === "reveal" ? babies[pos.index] ?? null : null;

  /*
   * The deadline has to be computed from the card that is actually up, so this
   * is resolved after `baby` rather than before it. `phase_ms` rides along
   * because the bottle timer draws a fraction of the phase, not a countdown —
   * without knowing the total it cannot tell a full bottle from an empty one.
   */
  const timings = timingsOf(settings);
  const deadline = deadlineMs(pos.phase, startedAt, timings, baby?.time_limit_ms);
  const phaseMs = phaseDurationMs(pos.phase, timings, baby?.time_limit_ms);

  /*
   * Wrong answers are a property of the deck, not of the player. In a
   * synchronized game everyone answers the same question at the same moment,
   * so handing two guests different option sets would hand them different
   * difficulty for the same points.
   *
   * The allocation is computed across the whole round rather than card by
   * card, which is what keeps any one name from being offered five times while
   * another is never offered at all. It is pure and deterministic, so
   * recomputing it on every request — including a player's mid-question
   * reload — yields the identical set.
   */
  const allocation =
    pos.round === "choice" ? allocateDistractors(babies, settings.choices_count) : null;
  const card = baby
    ? {
        id: baby.id,
        photo_url: baby.photo_url,
        order: baby.display_order,
        clue: baby.clue,
        answered: false,
        choices:
          pos.round === "choice"
            ? buildChoices(
                baby.correct_name,
                [],
                settings.choices_count,
                baby.id,
                allocation?.get(baby.id) ?? baby.distractors
              )
            : null,
      }
    : null;

  let myGuess: string | null = null;
  let result: LiveState["result"] = null;
  if (baby) {
    const guesses = await getGuessesForPlayer(player.id, pos.round);
    const mine = guesses.find((g) => g.baby_id === baby.id) ?? null;
    if (mine) {
      myGuess = mine.guessed_name;
      // Withheld until reveal — see the note on LiveState. During the question
      // the player sees only that they are locked in.
      if (pos.phase === "reveal") {
        result = { is_correct: mine.is_correct, points: mine.points };
      }
    }
  }

  const state: LiveState = {
    status: settings.status,
    phase: pos.phase,
    round: pos.round,
    index: pos.index,
    total_in_round: babies.length,
    server_now: new Date().toISOString(),
    deadline_at: deadline === null ? null : new Date(deadline).toISOString(),
    phase_ms: phaseMs,
    card,
    my_guess: myGuess,
    correct_name: pos.phase === "reveal" && baby ? baby.correct_name : null,
    result,
  };

  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
});
