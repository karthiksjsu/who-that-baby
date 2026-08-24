export type GameStatus = "draft" | "live" | "closed";

export interface GameSettings {
  status: GameStatus;
  winner_revealed: boolean;
  choices_count: number;
}

export interface Baby {
  id: string;
  photo_url: string;
  correct_name: string;
  display_order: number;
  created_at: string;
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

/** What a player receives for one card — never includes the correct answer directly. */
export interface GameCard {
  id: string;
  photo_url: string;
  order: number;
  choices: string[];
  answered: boolean;
}
