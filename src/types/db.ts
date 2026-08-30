export type GameStatus = "draft" | "live" | "closed";
export type GameRound = "choice" | "bonus";

export interface GameSettings {
  status: GameStatus;
  winner_revealed: boolean;
  choices_count: number;
  /** Server-owned position; see `lib/game/schedule`. */
  current_round: GameRound;
  current_index: number;
  phase: "idle" | "question" | "reveal" | "intermission" | "finished";
  phase_started_at: string | null;
}

export interface Baby {
  id: string;
  photo_url: string;
  correct_name: string;
  clue: string | null;
  round: GameRound;
  display_order: number;
  created_at: string;
  /**
   * Wrong answers the host pinned for this card. Null — the default — means
   * the card draws them from the other babies' names instead. Never includes
   * the correct name: that is added and shuffled in when the card is served.
   */
  distractors: string[] | null;
}

export interface Player {
  id: string;
  name: string;
  client_token: string;
  created_at: string;
}

export interface Guess {
  id: string;
  player_id: string;
  baby_id: string;
  round: GameRound;
  guessed_name: string;
  is_correct: boolean;
  points: number;
  response_time_ms: number;
  created_at: string;
}

export interface LeaderboardRow {
  player_id: string;
  name: string;
  score: number;
  total_time_ms: number;
  answered_count: number;
  last_answer_at: string | null;
}

/**
 * What a player receives for one card — never includes the correct answer
 * directly. `choices` is only present for the multiple-choice round.
 */
export interface GameCard {
  id: string;
  photo_url: string;
  order: number;
  clue: string | null;
  choices: string[] | null;
  answered: boolean;
}

/**
 * One snapshot of the live game, as handed to a player.
 *
 * `server_now` is included so the client can measure its own clock offset and
 * derive the countdown from `deadline_at` — a guest whose phone is a minute
 * fast must not see a different amount of time left from everyone else.
 *
 * `correct_name` and `result` are withheld until the reveal phase: releasing
 * them while answers are open would let one guest read the answer off a faster
 * neighbour's screen.
 */
export interface LiveState {
  status: GameStatus;
  phase: "idle" | "question" | "reveal" | "intermission" | "finished";
  round: GameRound;
  index: number;
  total_in_round: number;
  server_now: string;
  deadline_at: string | null;
  card: GameCard | null;
  /** What this player picked, echoed back so a refresh keeps them locked in. */
  my_guess: string | null;
  /** Reveal only. */
  correct_name: string | null;
  /** Reveal only. */
  result: { is_correct: boolean; points: number } | null;
}
