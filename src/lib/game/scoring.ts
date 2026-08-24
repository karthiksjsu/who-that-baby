const BASE_POINTS = 100;
const MAX_SPEED_BONUS = 50;
const SPEED_BONUS_WINDOW_MS = 10_000;
const MAX_RESPONSE_TIME_MS = 30_000;

export function clampResponseTime(ms: number): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.min(ms, MAX_RESPONSE_TIME_MS);
}

/** 100 base + up to 50 speed bonus (instant answer ≈ +50, 10s+ ≈ +0). Wrong = 0. */
export function scoreGuess(isCorrect: boolean, responseTimeMs: number): number {
  if (!isCorrect) return 0;
  const clamped = clampResponseTime(responseTimeMs);
  const bonus = Math.max(
    0,
    Math.min(MAX_SPEED_BONUS, Math.round((SPEED_BONUS_WINDOW_MS - clamped) / 200))
  );
  return BASE_POINTS + bonus;
}
