"use client";

import { AnimatePresence } from "framer-motion";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import { useLeaderboard } from "@/lib/game/useLeaderboard";
import { getPlayerId } from "@/lib/player-session";

export function LeaderboardList() {
  const { data } = useLeaderboard();
  const myId = typeof window !== "undefined" ? getPlayerId() : null;

  if (!data) {
    return <p className="text-white/90">Loading leaderboard…</p>;
  }

  if (data.length === 0) {
    return <p className="text-white/90">No guesses yet — be the first!</p>;
  }

  return (
    <ul className="flex w-full max-w-md flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {data.map((row, i) => (
          <LeaderboardRow
            key={row.player_id}
            row={row}
            rank={i + 1}
            highlight={row.player_id === myId}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
