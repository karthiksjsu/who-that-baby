/**
 * How long a player gets to answer a single card.
 *
 * Kept at or below `MAX_RESPONSE_TIME_MS` in `scoring.ts` — a timed-out guess
 * reports roughly this much elapsed time, and anything longer would just be
 * clamped away.
 */
export const QUESTION_TIME_MS = 30_000;

/** Milk level below which the bottle turns warm-red and starts to jitter. */
export const TIMER_DANGER_FRACTION = 0.25;

/**
 * Stored in `guesses.guessed_name` when the clock ran out before the player
 * answered. The column is NOT NULL, so a timeout still needs a value; this
 * sentinel keeps those rows obvious when reading the table by hand.
 */
export const TIMED_OUT_GUESS = "(no answer)";
