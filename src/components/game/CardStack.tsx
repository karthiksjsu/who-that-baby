"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { BabyCard } from "@/components/game/BabyCard";
import { BabyReaction } from "@/components/game/BabyReaction";
import { BottleTimer } from "@/components/game/BottleTimer";
import { ChoiceButtons } from "@/components/game/ChoiceButtons";
import { GuessInput } from "@/components/game/GuessInput";
import { ScorePopup } from "@/components/game/ScorePopup";
import { ProgressBar } from "@/components/game/ProgressBar";
import { Button } from "@/components/ui/button";
import { useCardStack } from "@/lib/game/useCardStack";
import type { GameRound } from "@/types/db";

const REVEAL_DELAY_MS = 1100;

export function CardStack({
  token,
  round,
  onFinished,
}: {
  token: string;
  round: GameRound;
  onFinished: () => void;
}) {
  const {
    phase,
    currentCard,
    upcoming,
    selected,
    result,
    error,
    submitGuess,
    submitTimeout,
    cardStartedAt,
    advance,
    totalCount,
    answeredSoFar,
  } = useCardStack(token, round);

  useEffect(() => {
    if (phase !== "revealing" || !result) return;
    const timer = setTimeout(advance, REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, result, advance]);

  useEffect(() => {
    if (phase === "done") onFinished();
  }, [phase, onFinished]);

  if (phase === "loading") {
    return <p className="text-white/90">Loading the babies…</p>;
  }

  if (phase === "error") {
    return <p className="glass-card rounded-2xl p-4 text-red-600">{error}</p>;
  }

  if (phase === "session-expired") {
    return (
      <div className="glass-card flex flex-col items-center gap-4 rounded-3xl p-8 text-center">
        <span className="text-6xl">🍼</span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg font-bold">Your session expired</p>
          <p className="text-sm text-muted-foreground">
            Looks like the game was reset. Head back and join again to keep playing.
          </p>
        </div>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          size="lg"
          className="h-11 w-full"
        >
          Rejoin
        </Button>
      </div>
    );
  }

  if (phase === "done" || !currentCard) {
    return null;
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between gap-3">
        <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold tracking-wide text-white uppercase">
          {round === "choice" ? "🎯 Crawl round" : "✨ Walk round"}
        </span>
        <BottleTimer
          // Remounts per card so the bottle refills for each new baby.
          key={currentCard.id}
          startedAt={cardStartedAt}
          running={phase === "answering" && cardStartedAt > 0}
          onExpire={submitTimeout}
        />
      </div>
      <ProgressBar answered={answeredSoFar} total={totalCount} round={round} />

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
        {result && (
          // Keyed on the card so the entrance replays fresh on every guess.
          <BabyReaction
            key={currentCard.id}
            variant={result.is_correct ? "happy" : "crying"}
          />
        )}
      </div>

      {currentCard.clue && (
        <p className="rounded-full bg-white/20 px-5 py-2 text-center text-base font-medium text-white shadow-sm">
          💡 {currentCard.clue}
        </p>
      )}

      {round === "choice" && currentCard.choices ? (
        <ChoiceButtons
          choices={currentCard.choices}
          selected={selected}
          correctName={result?.correct_name ?? null}
          disabled={phase === "revealing"}
          onChoose={submitGuess}
        />
      ) : (
        <GuessInput
          cardId={currentCard.id}
          disabled={phase === "revealing"}
          isCorrect={result?.is_correct ?? null}
          correctName={result?.correct_name ?? null}
          onSubmit={submitGuess}
        />
      )}
    </div>
  );
}
