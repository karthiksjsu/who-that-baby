"use client";

import { motion } from "framer-motion";
import { ConfettiBurst } from "@/components/shared/ConfettiBurst";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { useLeaderboard } from "@/lib/game/useLeaderboard";

export function WinnerReveal() {
  const { data } = useLeaderboard();
  const winner = data?.[0];

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <ConfettiBurst />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-2 text-center text-white"
      >
        <span className="text-sm font-semibold uppercase tracking-widest text-white/80">
          And the winner is…
        </span>
        {winner ? (
          <motion.h1
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
            className="font-display text-4xl font-extrabold sm:text-5xl"
          >
            🏆 {winner.name}!
          </motion.h1>
        ) : (
          <p className="text-white/90">Loading…</p>
        )}
        {winner && (
          <p className="text-white/90">
            {winner.score} points · {winner.answered_count} babies guessed
          </p>
        )}
      </motion.div>

      <div className="w-full rounded-3xl bg-white/10 p-4 backdrop-blur">
        <LeaderboardList />
      </div>
    </div>
  );
}
