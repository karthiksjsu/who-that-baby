"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BabyCard } from "@/components/game/BabyCard";
import { BabyReaction } from "@/components/game/BabyReaction";
import { BottleTimer } from "@/components/game/BottleTimer";
import { BonusRoundIntro } from "@/components/game/BonusRoundIntro";
import { ChoiceButtons } from "@/components/game/ChoiceButtons";
import { GameComplete } from "@/components/game/GameComplete";
import { GuessInput } from "@/components/game/GuessInput";
import { LockedInBadge } from "@/components/game/LockedInBadge";
import { ProgressBar } from "@/components/game/ProgressBar";
import { ScorePopup } from "@/components/game/ScorePopup";
import { Button } from "@/components/ui/button";
import { useLiveGame } from "@/lib/game/useLiveGame";

/**
 * The player's view of a synchronized game.
 *
 * Everyone in the room is on the same card at the same time, so this component
 * renders whatever the server says is live and never decides to move on by
 * itself. A player who has answered stays on the card, locked in, until the
 * clock runs out — showing them the result early would let the person beside
 * them read the answer off their screen.
 */
export function LiveGame({ token }: { token: string }) {
  const { state, error, expired, deadlineLocal, submitGuess } = useLiveGame(token);

  if (expired) {
    return (
      <div className="glass-card flex w-full max-w-md flex-col items-center gap-4 rounded-3xl p-8 text-center">
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

  if (!state) {
    return <p className="text-white/90">Loading the babies…</p>;
  }

  if (state.phase === "finished") {
    return <GameComplete />;
  }

  // Between rounds. Auto-advances, so there is nothing to press.
  if (state.phase === "intermission") {
    return <BonusRoundIntro />;
  }

  // Either the host hasn't started yet, or they've closed the game.
  if (state.phase === "idle" || !state.card) {
    return (
      <div className="glass-card flex w-full max-w-md flex-col items-center gap-4 rounded-3xl p-8 text-center">
        <motion.span
          className="text-6xl"
          animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          🍼
        </motion.span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg font-bold">You&apos;re in!</p>
          <p className="text-sm text-muted-foreground">
            Hang tight — the host will start the game soon.
          </p>
        </div>
      </div>
    );
  }

  const revealing = state.phase === "reveal";
  const lockedIn = state.my_guess !== null;

  return (
    /*
     * A column that fits the phone screen: everything but the photo is sized
     * by its content, and the photo takes what is left, so the answer buttons
     * stay above the fold while a player is on the clock.
     */
    <div className="flex w-full max-w-md flex-1 flex-col items-center gap-3 sm:gap-6">
      <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:gap-3">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide whitespace-nowrap text-white uppercase sm:px-4 sm:py-1.5 sm:text-sm">
          {state.round === "choice" ? "🎯 Crawl round" : "✨ Walk round"}
        </span>
        {deadlineLocal !== null && (
          <BottleTimer
            // Remounts per phase so the bottle refills for each new card.
            key={`${state.round}:${state.index}:${state.phase}`}
            deadlineAt={deadlineLocal}
            // The bottle draws a level, not a countdown, so it needs the
            // phase's full length — which is no longer a constant now that a
            // card can be given its own clock.
            durationMs={state.phase_ms ?? undefined}
            running={!revealing}
          />
        )}
      </div>

      <ProgressBar
        answered={state.index}
        total={state.total_in_round}
        round={state.round}
      />

      {/* Fills the leftover height on a phone, floors at a size still worth
          looking at; back to a fixed portrait card once there is room. */}
      <div className="relative min-h-[36svh] w-full flex-1 sm:aspect-square sm:min-h-0 sm:flex-none">
        <AnimatePresence>
          <BabyCard
            key={state.card.id}
            card={state.card}
            stackIndex={0}
            isTop
            exitDirection={null}
          />
        </AnimatePresence>

        {revealing && state.result && (
          <ScorePopup isCorrect={state.result.is_correct} points={state.result.points} />
        )}
        {revealing && (
          <BabyReaction
            key={`${state.card.id}-reaction`}
            // No answer at all counts as a miss, same as a wrong one.
            variant={state.result?.is_correct ? "happy" : "crying"}
          />
        )}
      </div>

      {state.card.clue && (
        <p className="shrink-0 rounded-full bg-white/20 px-4 py-1.5 text-center text-sm font-medium text-white shadow-sm sm:px-5 sm:py-2 sm:text-base">
          💡 {state.card.clue}
        </p>
      )}

      {error && (
        <p className="glass-card shrink-0 rounded-2xl px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {state.round === "choice" && state.card.choices ? (
        <ChoiceButtons
          choices={state.card.choices}
          selected={state.my_guess}
          correctName={revealing ? state.correct_name : null}
          disabled={lockedIn || revealing}
          onChoose={submitGuess}
        />
      ) : (
        <GuessInput
          cardId={state.card.id}
          disabled={lockedIn || revealing}
          isCorrect={revealing ? (state.result?.is_correct ?? false) : null}
          correctName={revealing ? state.correct_name : null}
          onSubmit={submitGuess}
        />
      )}

      {lockedIn && !revealing && <LockedInBadge />}
    </div>
  );
}
