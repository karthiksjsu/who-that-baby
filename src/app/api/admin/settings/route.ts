import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { getGameSettings, updateGameSettings } from "@/lib/db/settings";
import { broadcast } from "@/lib/realtime/broadcast";
import { GAME_SETTINGS_CHANNEL, GAME_SETTINGS_EVENT } from "@/lib/realtime/channels";
import type { GameStatus } from "@/types/db";

const VALID_STATUSES: GameStatus[] = ["draft", "live", "closed"];

export const GET = apiRoute(async () => {
  const settings = await getGameSettings();
  return NextResponse.json({ settings });
});

export const PATCH = apiRoute(async (request) => {
  const body = await request.json().catch(() => ({}));
  const patch: { status?: GameStatus; winner_revealed?: boolean } = {};

  if (typeof body.status === "string") {
    if (!VALID_STATUSES.includes(body.status as GameStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = body.status as GameStatus;
  }
  if (typeof body.winner_revealed === "boolean") {
    patch.winner_revealed = body.winner_revealed;
  }

  const settings = await updateGameSettings(patch);
  await broadcast(GAME_SETTINGS_CHANNEL, GAME_SETTINGS_EVENT, settings);
  return NextResponse.json({ settings });
});
