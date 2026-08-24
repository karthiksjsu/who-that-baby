"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Baby } from "lucide-react";
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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-party-gradient px-6 py-16 text-white">
      <PartyBackdrop />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
            className="flex size-20 items-center justify-center rounded-[1.75rem] bg-white/15 shadow-party ring-1 ring-white/40 backdrop-blur-sm"
          >
            <Baby className="size-10 text-white" strokeWidth={1.75} />
          </motion.div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-balance drop-shadow-md sm:text-6xl">
            Who&apos;s That Baby?
          </h1>
          <p className="max-w-xs text-balance text-base text-white/90">
            Guess which grown-up each baby photo belongs to. Fastest correct
            guesses win the most points!
          </p>
        </div>

        <div className="glass-card w-full rounded-3xl p-6 text-foreground sm:p-8">
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
      <p className="text-lg font-semibold">Hey {name}</p>
      {status === "draft" || !status ? (
        <>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="flex size-12 items-center justify-center rounded-2xl bg-primary/10"
          >
            <Baby className="size-6 text-primary" strokeWidth={1.75} />
          </motion.div>
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
