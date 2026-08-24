"use client";

import { useState } from "react";
import { RevealButton } from "@/components/admin/RevealButton";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";

export function AdminLeaderboardClient({ initialWinnerRevealed }: { initialWinnerRevealed: boolean }) {
  const [winnerRevealed, setWinnerRevealed] = useState(initialWinnerRevealed);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Live standings, updating as guests play.</p>
      </div>
      <RevealButton winnerRevealed={winnerRevealed} onRevealed={() => setWinnerRevealed(true)} />
      <LeaderboardList />
    </div>
  );
}
