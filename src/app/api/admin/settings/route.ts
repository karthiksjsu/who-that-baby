import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { countBabies } from "@/lib/db/babies";
import { getGameSettings, setPosition, updateGameSettings } from "@/lib/db/settings";
import { startingPosition } from "@/lib/game/schedule";
import { broadcast } from "@/lib/realtime/broadcast";
import {
  GAME_SETTINGS_CHANNEL,
  GAME_SETTINGS_EVENT,
  GAME_STATE_CHANNEL,
  GAME_STATE_EVENT,
} from "@/lib/realtime/channels";
import type { GameStatus } from "@/types/db";

/**
 * Never cache this. It is polled continuously and must always reflect the
 * database right now; a cached response leaves the room stuck on a stale phase
 * until someone reloads the page.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const before = await getGameSettings();
  let settings = await updateGameSettings(patch);

  // Going live from a standing start is what actually begins the room's clock.
  // Guarded on `phase === "idle"` so toggling live -> closed -> live to fix a
  // mistake resumes where everyone was, rather than yanking the room back to
  // the first baby mid-game.
  if (patch.status === "live" && before.phase === "idle") {
    const [choice, bonus] = await Promise.all([
      countBabies("choice"),
      countBabies("bonus"),
    ]);
    settings = await setPosition(startingPosition({ choice, bonus }));
  }

  await Promise.all([
    broadcast(GAME_SETTINGS_CHANNEL, GAME_SETTINGS_EVENT, settings),
    broadcast(GAME_STATE_CHANNEL, GAME_STATE_EVENT, {
      round: settings.current_round,
      index: settings.current_index,
      phase: settings.phase,
    }),
  ]);
  return NextResponse.json({ settings });
});
