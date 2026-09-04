import { QUESTION_TIME_MS, REVEAL_MS, INTERMISSION_MS } from "@/lib/game/constants";
import type { GameRound, Timings } from "@/types/db";

/**
 * What the game falls back to when nothing says otherwise.
 *
 * The constants survive the move into the database because a client rendering
 * before its first state response still has to put a number on the screen, and
 * because a settings row read from a project where migration 0010 has not been
 * applied comes back with these columns missing.
 */
export const DEFAULT_TIMINGS: Timings = {
  question_time_ms: QUESTION_TIME_MS,
  reveal_ms: REVEAL_MS,
  intermission_ms: INTERMISSION_MS,
};

/** Falls back per-field, so a half-migrated row still yields sane numbers. */
export function timingsOf(partial: Partial<Timings> | null | undefined): Timings {
  return {
    question_time_ms: partial?.question_time_ms ?? DEFAULT_TIMINGS.question_time_ms,
    reveal_ms: partial?.reveal_ms ?? DEFAULT_TIMINGS.reveal_ms,
    intermission_ms: partial?.intermission_ms ?? DEFAULT_TIMINGS.intermission_ms,
  };
}

/**
 * Where the whole room is in the game.
 *
 * - `idle` — game not started; nothing is live yet.
 * - `question` — a card is up and answers are accepted.
 * - `reveal` — answers closed, correct name and reactions shown to everyone.
 * - `intermission` — the "time to walk" screen between rounds.
 * - `finished` — every card in both rounds is done.
 */
export type GamePhase = "idle" | "question" | "reveal" | "intermission" | "finished";

export interface Position {
  round: GameRound;
  index: number;
  phase: GamePhase;
}

export interface RoundCounts {
  choice: number;
  bonus: number;
}

/**
 * How long a phase runs before the game moves itself on, or `null` for phases
 * that only a host action can leave.
 *
 * `cardLimitMs` is the current baby's own answer time and is consulted for the
 * question phase only. Passing it for any other phase is harmless and ignored,
 * which matters because the callers compute a deadline once for whatever phase
 * the room happens to be in rather than branching first.
 */
export function phaseDurationMs(
  phase: GamePhase,
  timings: Timings = DEFAULT_TIMINGS,
  cardLimitMs?: number | null
): number | null {
  switch (phase) {
    case "question":
      return cardLimitMs ?? timings.question_time_ms;
    case "reveal":
      return timings.reveal_ms;
    case "intermission":
      return timings.intermission_ms;
    case "idle":
    case "finished":
      return null;
  }
}

/** The instant a phase is due to end, or `null` if it never expires on its own. */
export function deadlineMs(
  phase: GamePhase,
  startedAtMs: number | null,
  timings: Timings = DEFAULT_TIMINGS,
  cardLimitMs?: number | null
): number | null {
  const duration = phaseDurationMs(phase, timings, cardLimitMs);
  if (duration === null || startedAtMs === null) return null;
  return startedAtMs + duration;
}

/**
 * The position a fresh game starts from.
 *
 * Takes the round sizes because an empty round must be skipped rather than
 * started: parking the room on `question` with no card behind it would show
 * everyone a waiting screen while a 30 second clock quietly ran down. A game
 * with no babies at all goes straight to finished.
 */
export function startingPosition(counts: RoundCounts): Position {
  if (counts.choice > 0) return { round: "choice", index: 0, phase: "question" };
  if (counts.bonus > 0) return { round: "bonus", index: 0, phase: "question" };
  return { round: "choice", index: 0, phase: "finished" };
}

/**
 * The next position after the current phase expires.
 *
 * Pure and total — no IO, every phase has a defined successor — so the whole
 * game can be stepped through in a test without a database. A round with zero
 * babies is skipped rather than parking the room on an empty question.
 */
export function nextPosition(pos: Position, counts: RoundCounts): Position {
  const total = (round: GameRound) => (round === "choice" ? counts.choice : counts.bonus);

  switch (pos.phase) {
    case "question":
      // Answers close; everyone sees the same reveal.
      return { ...pos, phase: "reveal" };

    case "reveal": {
      const nextIndex = pos.index + 1;
      if (nextIndex < total(pos.round)) {
        return { round: pos.round, index: nextIndex, phase: "question" };
      }
      if (pos.round === "choice") {
        // Skip the walk round entirely if nothing was filed under it.
        return counts.bonus > 0
          ? { round: "bonus", index: 0, phase: "intermission" }
          : { round: "bonus", index: 0, phase: "finished" };
      }
      return { round: "bonus", index: pos.index, phase: "finished" };
    }

    case "intermission":
      return { round: "bonus", index: 0, phase: "question" };

    case "idle":
    case "finished":
      return pos;
  }
}

/**
 * Whether `pos` is a phase where a player can still submit an answer for
 * `babyId`. The server checks this rather than trusting the client, so a stale
 * tab can't answer a card the room has already moved past.
 */
export function acceptsAnswers(pos: Position): boolean {
  return pos.phase === "question";
}
