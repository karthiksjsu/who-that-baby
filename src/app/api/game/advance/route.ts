import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { countBabies } from "@/lib/db/babies";
import { advancePosition, getGameSettings, positionOf } from "@/lib/db/settings";
import { DEADLINE_GRACE_MS } from "@/lib/game/constants";
import { deadlineMs, nextPosition } from "@/lib/game/schedule";
import { broadcast } from "@/lib/realtime/broadcast";
import { GAME_STATE_CHANNEL, GAME_STATE_EVENT } from "@/lib/realtime/channels";

/**
 * Moves the whole room to the next phase, once the current one has expired.
 *
 * Deliberately callable by any player rather than only the host: every client
 * fires this when its own countdown hits zero, so the game keeps moving even if
 * the host has locked their laptop or closed the tab. That only works because
 * the call is idempotent in two independent ways.
 *
 * First, the deadline is recomputed here from `phase_started_at`; a client that
 * asks early is refused regardless of what its clock says. Second, the write is
 * a compare-and-set against the position the caller believed was current, so of
 * fifty phones firing in the same tick exactly one wins and the other
 * forty-nine get `null` and simply re-read state.
 */
export const POST = apiRoute(async (request) => {
  const settings = await getGameSettings();
  const pos = positionOf(settings);

  if (pos.phase === "idle" || pos.phase === "finished") {
    return NextResponse.json({ advanced: false, reason: "not-running" });
  }
  if (settings.status !== "live") {
    return NextResponse.json({ advanced: false, reason: "not-live" });
  }

  const startedAt = settings.phase_started_at
    ? Date.parse(settings.phase_started_at)
    : null;
  const deadline = deadlineMs(pos.phase, startedAt);
  if (deadline === null) {
    return NextResponse.json({ advanced: false, reason: "no-deadline" });
  }
  if (Date.now() + DEADLINE_GRACE_MS < deadline) {
    // Someone's clock is running fast. Harmless — they'll try again.
    return NextResponse.json({ advanced: false, reason: "too-early" });
  }

  // The caller tells us what it thought was current. If it's stale, the room
  // has already moved and there is nothing to do.
  const body = await request.json().catch(() => ({}));
  const expected =
    typeof body.expected_round === "string" &&
    typeof body.expected_index === "number" &&
    typeof body.expected_phase === "string"
      ? {
          round: body.expected_round,
          index: body.expected_index,
          phase: body.expected_phase,
        }
      : null;
  if (
    expected &&
    (expected.round !== pos.round ||
      expected.index !== pos.index ||
      expected.phase !== pos.phase)
  ) {
    return NextResponse.json({ advanced: false, reason: "stale" });
  }

  const [choice, bonus] = await Promise.all([
    countBabies("choice"),
    countBabies("bonus"),
  ]);
  const target = nextPosition(pos, { choice, bonus });
  const updated = await advancePosition(pos, target);

  if (!updated) {
    // Lost the race to another client; the room is already where we wanted it.
    return NextResponse.json({ advanced: false, reason: "raced" });
  }

  await broadcast(GAME_STATE_CHANNEL, GAME_STATE_EVENT, {
    round: target.round,
    index: target.index,
    phase: target.phase,
  });

  return NextResponse.json({ advanced: true, position: target });
});
