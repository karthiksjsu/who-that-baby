import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { deleteAllPlayers } from "@/lib/db/players";
import { updateGameSettings } from "@/lib/db/settings";
import { broadcast } from "@/lib/realtime/broadcast";
import { GAME_SETTINGS_CHANNEL, GAME_SETTINGS_EVENT } from "@/lib/realtime/channels";
import { LEADERBOARD_CHANNEL, LEADERBOARD_EVENT } from "@/lib/realtime/channels";

/** Wipes all players/guesses and resets the game to draft. Baby photos are kept. */
export const POST = apiRoute(async () => {
  await deleteAllPlayers();
  const settings = await updateGameSettings({ status: "draft", winner_revealed: false });

  await Promise.all([
    broadcast(GAME_SETTINGS_CHANNEL, GAME_SETTINGS_EVENT, settings),
    broadcast(LEADERBOARD_CHANNEL, LEADERBOARD_EVENT, {}),
  ]);

  return NextResponse.json({ settings });
});
