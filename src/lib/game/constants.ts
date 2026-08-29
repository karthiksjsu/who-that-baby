/**
 * How long a player gets to answer a single card.
 *
 * Kept at or below `MAX_RESPONSE_TIME_MS` in `scoring.ts` — a timed-out guess
 * reports roughly this much elapsed time, and anything longer would just be
 * clamped away.
 */
export const QUESTION_TIME_MS = 30_000;

/**
 * How long everyone sits on the reveal — correct name, reaction face, points —
 * before the room moves to the next baby.
 */
export const REVEAL_MS = 4_000;

/** The "time to walk" screen shown once between the crawl and walk rounds. */
export const INTERMISSION_MS = 6_000;

/**
 * Slack allowed when deciding a phase has expired.
 *
 * Every client races to advance the room when its own clock passes the
 * deadline, and phone clocks drift. Without a little tolerance a device running
 * slightly fast would try to advance early and get rejected on every poll.
 */
export const DEADLINE_GRACE_MS = 250;

/** Milk level below which the bottle turns warm-red and starts to jitter. */
export const TIMER_DANGER_FRACTION = 0.25;

/**
 * Stored in `guesses.guessed_name` when the clock ran out before the player
 * answered. The column is NOT NULL, so a timeout still needs a value; this
 * sentinel keeps those rows obvious when reading the table by hand.
 */
export const TIMED_OUT_GUESS = "(no answer)";
