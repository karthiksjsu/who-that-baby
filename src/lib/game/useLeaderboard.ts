"use client";

import { useLiveQuery } from "@/lib/game/useLiveQuery";
import { LEADERBOARD_CHANNEL, LEADERBOARD_EVENT } from "@/lib/realtime/channels";
import type { LeaderboardRow } from "@/types/db";

async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const res = await fetch("/api/leaderboard", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load leaderboard.");
  const { leaderboard } = await res.json();
  return leaderboard as LeaderboardRow[];
}

export function useLeaderboard() {
  return useLiveQuery<LeaderboardRow[]>(
    fetchLeaderboard,
    LEADERBOARD_CHANNEL,
    LEADERBOARD_EVENT,
    5000
  );
}
