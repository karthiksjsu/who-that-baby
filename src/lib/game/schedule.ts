import { QUESTION_TIME_MS, REVEAL_MS, INTERMISSION_MS } from "@/lib/game/constants";
import type { GameRound } from "@/types/db";

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
 */
export function phaseDurationMs(phase: GamePhase): number | null {
  switch (phase) {
    case "question":
      return QUESTION_TIME_MS;
    case "reveal":
      return REVEAL_MS;
    case "intermission":
      return INTERMISSION_MS;
    case "idle":
    case "finished":
      return null;
  }
}

/** The instant a phase is due to end, or `null` if it never expires on its own. */
export function deadlineMs(phase: GamePhase, startedAtMs: number | null): number | null {
  const duration = phaseDurationMs(phase);
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
