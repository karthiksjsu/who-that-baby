"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { useGameStatus } from "@/lib/game/useGameStatus";

export default function LeaderboardPage() {
  const router = useRouter();
  const { data: status } = useGameStatus();

  useEffect(() => {
    if (status?.status === "closed" && status.winner_revealed) {
      router.replace("/winner");
    }
  }, [status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-party-gradient px-4 py-12">
      <div className="flex flex-col items-center gap-1 text-center text-white">
        <span className="text-4xl">🏆</span>
        <h1 className="font-display text-3xl font-extrabold">Leaderboard</h1>
        <p className="text-sm text-white/85">Updates live as everyone plays</p>
      </div>
      <LeaderboardList />
    </main>
  );
}
