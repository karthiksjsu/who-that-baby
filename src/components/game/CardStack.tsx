"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { BabyCard } from "@/components/game/BabyCard";
import { ChoiceButtons } from "@/components/game/ChoiceButtons";
import { ScorePopup } from "@/components/game/ScorePopup";
import { ProgressBar } from "@/components/game/ProgressBar";
import { GameComplete } from "@/components/game/GameComplete";
import { useCardStack } from "@/lib/game/useCardStack";

const REVEAL_DELAY_MS = 1100;

export function CardStack({ token }: { token: string }) {
  const {
    phase,
    currentCard,
    upcoming,
    selected,
    result,
    error,
    submitGuess,
    advance,
    totalCount,
    answeredSoFar,
  } = useCardStack(token);

  useEffect(() => {
    if (phase !== "revealing" || !result) return;
    const timer = setTimeout(advance, REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, result, advance]);

  if (phase === "loading") {
    return <p className="text-white/90">Loading the babies…</p>;
  }

  if (phase === "error") {
    return <p className="rounded-2xl bg-white/95 p-4 text-red-600">{error}</p>;
  }

  if (phase === "done" || !currentCard) {
    return <GameComplete />;
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <ProgressBar answered={answeredSoFar} total={totalCount} />

      <div className="relative aspect-[3/4] w-full">
        <AnimatePresence>
          {upcoming
            .slice()
            .reverse()
            .map((card, i) => {
              const stackIndex = upcoming.length - 1 - i;
              const isTop = stackIndex === 0;
              return (
                <BabyCard
                  key={card.id}
                  card={card}
                  stackIndex={stackIndex}
                  isTop={isTop}
                  exitDirection={
                    isTop && phase === "revealing" && result
                      ? result.is_correct
                        ? "correct"
                        : "wrong"
                      : null
                  }
                />
              );
            })}
        </AnimatePresence>
        {result && <ScorePopup isCorrect={result.is_correct} points={result.points} />}
      </div>

      <ChoiceButtons
        choices={currentCard.choices}
        selected={selected}
        correctName={result?.correct_name ?? null}
        disabled={phase === "revealing"}
        onChoose={submitGuess}
      />
    </div>
  );
}
