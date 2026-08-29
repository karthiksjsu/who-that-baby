"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayFlow } from "@/components/game/PlayFlow";
import { PartyBackdrop } from "@/components/shared/PartyBackdrop";
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
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-clip bg-party-gradient px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <PartyBackdrop />
      {/* Grows to fill the phone screen so the game can size the photo to
          whatever height is left over, rather than overflowing the fold. */}
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center">
        {token ? <PlayFlow token={token} /> : null}
      </div>
    </main>
  );
}
