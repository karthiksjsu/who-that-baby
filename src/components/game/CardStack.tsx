"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Baby, Lightbulb, Sparkles, Target } from "lucide-react";
import { BabyCard } from "@/components/game/BabyCard";
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
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Baby className="size-7 text-primary" strokeWidth={1.75} />
        </div>
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
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1 text-xs font-bold tracking-wide text-white uppercase">
        {round === "choice" ? (
          <>
            <Target className="size-3.5" strokeWidth={2.25} />
            Main round
          </>
        ) : (
          <>
            <Sparkles className="size-3.5" strokeWidth={2.25} />
            Bonus round
          </>
        )}
      </span>
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

      {currentCard.clue && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-center text-sm font-medium text-white shadow-sm">
          <Lightbulb className="size-4 shrink-0" strokeWidth={1.75} />
          {currentCard.clue}
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
