import "server-only";
import { dbError } from "@/lib/db/error";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { GameSettings } from "@/types/db";
import type { Position } from "@/lib/game/schedule";

/*
 * Deliberately `*` rather than a column list.
 *
 * Naming the timing columns explicitly meant that a deploy landing before its
 * migration did not merely disable the timings panel — PostgREST rejected the
 * whole select, `getGameSettings` threw, and since every game request goes
 * through it, the entire site returned the error page. That is a bad trade for
 * three optional integers.
 *
 * With `*` the row comes back with whatever columns exist, and `timingsOf`
 * fills in defaults per field for any that do not. An unmigrated database now
 * costs the feature instead of the party.
 */
const COLUMNS = "*";

export async function getGameSettings(): Promise<GameSettings> {
  const { data, error } = await supabaseAdmin()
    .from("game_settings")
    .select(COLUMNS)
    .eq("id", true)
    .single();
  if (error) throw dbError(error, "game_settings");
  return data as unknown as GameSettings;
}

export async function updateGameSettings(
  patch: Partial<
    Pick<
      GameSettings,
      | "status"
      | "winner_revealed"
      | "choices_count"
      | "question_time_ms"
      | "reveal_ms"
      | "intermission_ms"
    >
  >
): Promise<GameSettings> {
  const { data, error } = await supabaseAdmin()
    .from("game_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select(COLUMNS)
    .single();
  if (error) throw dbError(error, "game_settings");
  return data as unknown as GameSettings;
}

/** The room's current position, read off the settings row. */
export function positionOf(settings: GameSettings): Position {
  return {
    round: settings.current_round,
    index: settings.current_index,
    phase: settings.phase,
  };
}

/**
 * Moves the room from `from` to `to`, but only if it is still at `from`.
 *
 * Every client races to advance once its clock passes the deadline, so this is
 * a compare-and-set: the `.eq()` chain on all three position columns means
 * exactly one of a hundred simultaneous requests updates the row and the rest
 * match nothing. Returns `null` for the losers, who should just re-read state
 * rather than treating it as an error.
 */
export async function advancePosition(
  from: Position,
  to: Position
): Promise<GameSettings | null> {
  const { data, error } = await supabaseAdmin()
    .from("game_settings")
    .update({
      current_round: to.round,
      current_index: to.index,
      phase: to.phase,
      phase_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .eq("current_round", from.round)
    .eq("current_index", from.index)
    .eq("phase", from.phase)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw dbError(error, "game_settings");
  return (data as unknown as GameSettings) ?? null;
}

/** Unconditionally parks the room at `to` — used by go-live and reset. */
export async function setPosition(
  to: Position,
  opts: { clearStartedAt?: boolean } = {}
): Promise<GameSettings> {
  const { data, error } = await supabaseAdmin()
    .from("game_settings")
    .update({
      current_round: to.round,
      current_index: to.index,
      phase: to.phase,
      phase_started_at: opts.clearStartedAt ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .select(COLUMNS)
    .single();
  if (error) throw dbError(error, "game_settings");
  return data as unknown as GameSettings;
}
