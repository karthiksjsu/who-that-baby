"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardStack } from "@/components/game/CardStack";
import { useGameStatus } from "@/lib/game/useGameStatus";
import { getPlayerToken } from "@/lib/player-session";

export default function PlayPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const { data: status } = useGameStatus();

  useEffect(() => {
    const t = getPlayerToken();
    if (!t) {
      router.replace("/");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (status?.status === "closed") {
      router.replace(status.winner_revealed ? "/winner" : "/leaderboard");
    }
  }, [status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-party-gradient px-4 py-10">
      {token ? <CardStack token={token} /> : null}
    </main>
  );
}
