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
 */
const MAX_RESPONSE_TIME_MS = QUESTION_TIME_MS;

export function clampResponseTime(ms: number): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.min(ms, MAX_RESPONSE_TIME_MS);
}

/** Flat points for a correct answer in that round. Wrong or unanswered = 0. */
export function scoreGuess(isCorrect: boolean, round: GameRound): number {
  return isCorrect ? POINTS_PER_ROUND[round] : 0;
}
