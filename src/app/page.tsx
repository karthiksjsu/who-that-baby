"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { JoinForm } from "@/components/join/JoinForm";
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
      <Decor />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-6xl">🍼</span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-balance drop-shadow-sm sm:text-5xl">
            Who&apos;s That Baby?
          </h1>
          <p className="max-w-xs text-balance text-white/90">
            Guess which grown-up each baby photo belongs to. Fastest correct
            guesses win the most points!
          </p>
        </div>

        <div className="w-full rounded-3xl bg-white/95 p-6 text-foreground shadow-xl backdrop-blur sm:p-8">
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
            animate={{ rotate: [0, -8, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="text-4xl"
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

function Decor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -right-10 size-72 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute right-10 top-24 text-4xl opacity-30">👶</div>
      <div className="absolute bottom-16 left-8 text-4xl opacity-30">🎉</div>
    </div>
  );
}
