"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { PartyBackdrop } from "@/components/shared/PartyBackdrop";
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
    <main className="relative flex min-h-screen flex-col items-center gap-6 overflow-hidden bg-party-gradient px-4 py-12">
      <PartyBackdrop />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-1 text-center text-white"
      >
        <motion.span
          className="text-7xl drop-shadow-xl"
          animate={{ rotate: [0, -6, 6, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          🏆
        </motion.span>
        <h1 className="font-display text-5xl font-extrabold drop-shadow-md">Leaderboard</h1>
        <p className="text-sm text-white/85">Updates live as everyone plays</p>
      </motion.div>
      <div className="relative z-10 w-full">
        <LeaderboardList />
      </div>
    </main>
  );
}
