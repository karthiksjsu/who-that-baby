import { QUESTION_TIME_MS } from "@/lib/game/constants";
import type { GameRound } from "@/types/db";

/**
 * Points for a correct answer, by round.
 *
 * The walk round pays more because typing a name blind is far harder than
 * picking from four options — without the gap the intro screen's promise of
 * "extra points" would be a lie, and there'd be no reason to dread it.
 */
export const POINTS_PER_ROUND: Record<GameRound, number> = {
  choice: 10,
  bonus: 25,
};

/**
 * A timed-out guess reports roughly a full clock, so cap at the same value.
 * Response time no longer affects the score, but it is still recorded: the
 * leaderboard view orders by `score desc, total_time_ms asc`, so answering
 * quickly is what separates two players on the same number of right answers.
 *
 * The cap has to be the clock that card actually ran on, not a fixed 30
 * seconds. Once a host can give one card ninety, a fixed cap would record
 * every answer past thirty as exactly thirty, and the tiebreaker would call a
 * 35-second answer and an 85-second answer equally fast.
 */
export function clampResponseTime(ms: number, limitMs: number = QUESTION_TIME_MS): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.min(ms, limitMs);
}

/** Flat points for a correct answer in that round. Wrong or unanswered = 0. */
export function scoreGuess(isCorrect: boolean, round: GameRound): number {
  return isCorrect ? POINTS_PER_ROUND[round] : 0;
}
