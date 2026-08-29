import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { deleteAllPlayers } from "@/lib/db/players";
import { setPosition, updateGameSettings } from "@/lib/db/settings";
import { broadcast } from "@/lib/realtime/broadcast";
import {
  GAME_SETTINGS_CHANNEL,
  GAME_SETTINGS_EVENT,
  GAME_STATE_CHANNEL,
  GAME_STATE_EVENT,
  LEADERBOARD_CHANNEL,
  LEADERBOARD_EVENT,
} from "@/lib/realtime/channels";

/** Wipes all players/guesses and resets the game to draft. Baby photos are kept. */
export const POST = apiRoute(async () => {
  await deleteAllPlayers();
  await updateGameSettings({ status: "draft", winner_revealed: false });

  // Back to idle with no phase timestamp. Leaving a stale `phase_started_at`
  // behind would let the first client to poll compute an already-passed
  // deadline and immediately advance a game nobody has started.
  const settings = await setPosition(
    { round: "choice", index: 0, phase: "idle" },
    { clearStartedAt: true }
  );

  await Promise.all([
    broadcast(GAME_SETTINGS_CHANNEL, GAME_SETTINGS_EVENT, settings),
    broadcast(GAME_STATE_CHANNEL, GAME_STATE_EVENT, {
      round: settings.current_round,
      index: settings.current_index,
      phase: settings.phase,
    }),
    broadcast(LEADERBOARD_CHANNEL, LEADERBOARD_EVENT, {}),
  ]);

  return NextResponse.json({ settings });
});
