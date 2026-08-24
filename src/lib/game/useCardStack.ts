"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearPlayerSession } from "@/lib/player-session";
import type { GameCard, GameRound } from "@/types/db";

type Phase = "loading" | "answering" | "revealing" | "done" | "error" | "session-expired";

interface GuessResult {
  is_correct: boolean;
  points: number;
  correct_name: string;
}

export function useCardStack(token: string | null, round: GameRound) {
  const [allCount, setAllCount] = useState(0);
  const [queue, setQueue] = useState<GameCard[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 0 until `load()` sets a real timestamp; answering is disabled until then.
  const cardStartedAt = useRef<number>(0);

  const load = useCallback(async () => {
    if (!token) return;
    setPhase("loading");
    try {
      const res = await fetch(
        `/api/game/cards?token=${encodeURIComponent(token)}&round=${round}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (res.status === 404) {
        clearPlayerSession();
        setPhase("session-expired");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Couldn't load the game.");

      const cards = data.cards as GameCard[];
      setAllCount(cards.length);
      const unanswered = cards.filter((c) => !c.answered);
      setQueue(unanswered);
      cardStartedAt.current = Date.now();
      setPhase(unanswered.length ? "answering" : "done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("error");
    }
  }, [token, round]);

  useEffect(() => {
    load();
  }, [load]);

  const currentCard = queue[0] ?? null;

  const submitGuess = useCallback(
    async (guessedName: string) => {
      if (!token || !currentCard || phase !== "answering") return;
      setSelected(guessedName);
      setPhase("revealing");
      const responseTimeMs = Date.now() - cardStartedAt.current;

      try {
        const res = await fetch("/api/game/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_token: token,
            baby_id: currentCard.id,
            round,
            guessed_name: guessedName,
            response_time_ms: responseTimeMs,
          }),
        });
        const data = await res.json();
        if (res.status === 404) {
          clearPlayerSession();
          setPhase("session-expired");
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "Couldn't submit that guess.");
        setResult(data as GuessResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setPhase("error");
      }
    },
    [token, currentCard, phase, round]
  );

  const advance = useCallback(() => {
    setQueue((prev) => prev.slice(1));
    setSelected(null);
    setResult(null);
    cardStartedAt.current = Date.now();
    setPhase((prevPhase) => (prevPhase === "error" ? prevPhase : "answering"));
  }, []);

  useEffect(() => {
    if (queue.length === 0 && phase === "answering") {
      setPhase("done");
    }
  }, [queue.length, phase]);

  return {
    phase,
    currentCard,
    upcoming: queue.slice(0, 3),
    selected,
    result,
    error,
    submitGuess,
    advance,
    remaining: queue.length,
    totalCount: allCount,
    answeredSoFar: allCount - queue.length,
  };
}
