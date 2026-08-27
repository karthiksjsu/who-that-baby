import { QUESTION_TIME_MS } from "@/lib/game/constants";

const BASE_POINTS = 100;
const MAX_SPEED_BONUS = 50;

/**
 * The bonus decays across the whole question clock rather than a fixed window.
 * Tied to `QUESTION_TIME_MS` deliberately: when the two drifted apart the bonus
 * hit zero a third of the way through the timer and every later answer scored
 * an identical 100, so speed stopped separating players.
 */
const SPEED_BONUS_WINDOW_MS = QUESTION_TIME_MS;

/** A timed-out guess reports roughly a full clock, so cap at the same value. */
const MAX_RESPONSE_TIME_MS = QUESTION_TIME_MS;

export function clampResponseTime(ms: number): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.min(ms, MAX_RESPONSE_TIME_MS);
}

/** 100 base + up to 50 speed bonus, decaying linearly to 0 at the buzzer. Wrong = 0. */
export function scoreGuess(isCorrect: boolean, responseTimeMs: number): number {
  if (!isCorrect) return 0;
  const clamped = clampResponseTime(responseTimeMs);
  const remaining = Math.max(0, SPEED_BONUS_WINDOW_MS - clamped);
  const bonus = Math.round((remaining / SPEED_BONUS_WINDOW_MS) * MAX_SPEED_BONUS);
  return BASE_POINTS + bonus;
}
