"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { JoinForm } from "@/components/join/JoinForm";
import { PartyBackdrop } from "@/components/shared/PartyBackdrop";
import { useGameStatus } from "@/lib/game/useGameStatus";
import { getPlayerName, getPlayerToken } from "@/lib/player-session";

export default function HomePage() {
  const router = useRouter();
  const { data: status } = useGameStatus();
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(() => {
    if (getPlayerToken()) setPlayerName(getPlayerName());
    setCheckedSession(true);
  }, []);

  useEffect(() => {
    if (!playerName || !status) return;
    if (status.status === "live") router.replace("/play");
    else if (status.status === "closed") {
      router.replace(status.winner_revealed ? "/winner" : "/leaderboard");
    }
  }, [playerName, status, router]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-clip bg-party-gradient px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] text-white sm:py-16">
      <PartyBackdrop />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 text-center sm:gap-8"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.span
            className="text-7xl drop-shadow-xl sm:text-9xl"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
          >
            <motion.span
              className="block"
              animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              🍼
            </motion.span>
          </motion.span>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-balance drop-shadow-md sm:text-7xl">
            Who&apos;s That Baby?
          </h1>
          <p className="max-w-xs text-balance text-base text-white/90 sm:text-lg">
            Guess which grown-up each baby photo belongs to. Fastest correct
            guesses win the most points!
          </p>
        </div>

        <div className="glass-card w-full rounded-3xl p-5 text-foreground sm:p-8">
          {!checkedSession ? null : playerName ? (
            <WaitingState name={playerName} status={status?.status} />
          ) : (
            <JoinForm onJoined={setPlayerName} />
          )}
        </div>
      </motion.div>
    </main>
  );
}

function WaitingState({ name, status }: { name: string; status?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="text-lg font-semibold">
        Hey {name} 👋
      </p>
      {status === "draft" || !status ? (
        <>
          <motion.span
            animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="text-6xl"
          >
            🍼
          </motion.span>
          <p className="text-sm text-muted-foreground">
            You&apos;re in! Hang tight — the host will start the game soon.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">One sec, getting things ready…</p>
      )}
    </div>
  );
}
