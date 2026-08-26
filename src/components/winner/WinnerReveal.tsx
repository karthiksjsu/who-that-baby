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
        className="flex flex-col items-center gap-3 text-center text-white"
      >
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
          And the winner is…
        </span>

        <motion.span
          className="text-9xl drop-shadow-xl"
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: [0, 1.3, 1], rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.15 }}
        >
          <motion.span
            className="block"
            animate={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            👑
          </motion.span>
        </motion.span>

        {winner ? (
          <motion.h1
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
            className="font-display text-6xl font-extrabold drop-shadow-md sm:text-7xl"
          >
            {winner.name}!
          </motion.h1>
        ) : (
          <p className="text-white/90">Loading…</p>
        )}
        {winner && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl font-medium text-white/90"
          >
            {winner.score} points · {winner.answered_count} babies guessed
          </motion.p>
        )}
      </motion.div>

      <div className="w-full rounded-3xl bg-white/10 p-4 backdrop-blur">
        <LeaderboardList />
      </div>
    </div>
  );
}
