"use client";

import { useLiveQuery } from "@/lib/game/useLiveQuery";
import { GAME_SETTINGS_CHANNEL, GAME_SETTINGS_EVENT } from "@/lib/realtime/channels";
import type { GameSettings } from "@/types/db";

async function fetchStatus(): Promise<GameSettings> {
  const res = await fetch("/api/game/status", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load game status.");
  const { settings } = await res.json();
  return settings as GameSettings;
}

export function useGameStatus() {
  return useLiveQuery<GameSettings>(fetchStatus, GAME_SETTINGS_CHANNEL, GAME_SETTINGS_EVENT, 5000);
}
