import "server-only";
import { dbError } from "@/lib/db/error";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Baby, GameRound } from "@/types/db";

export async function listBabies(round?: GameRound): Promise<Baby[]> {
  let query = supabaseAdmin().from("babies").select("*");
  if (round) query = query.eq("round", round);
  const { data, error } = await query.order("display_order", { ascending: true });
  if (error) throw dbError(error, "babies");
  return data as Baby[];
}

/**
 * How many babies are filed under a round.
 *
 * A count rather than `listBabies(round).length` — the advance endpoint calls
 * this on every phase change for both rounds, and it only ever needs the size
 * to decide whether the round is over.
 */
export async function countBabies(round: GameRound): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("babies")
    .select("id", { count: "exact", head: true })
    .eq("round", round);
  if (error) throw dbError(error, "babies");
  return count ?? 0;
}

export async function createBaby(input: {
  photo_url: string;
  correct_name: string;
  clue: string | null;
  round: GameRound;
  display_order: number;
}): Promise<Baby> {
  const { data, error } = await supabaseAdmin()
    .from("babies")
    .insert(input)
    .select("*")
    .single();
  if (error) throw dbError(error, "babies");
  return data as Baby;
}

export async function updateBaby(
  id: string,
  patch: Partial<
    Pick<
      Baby,
      | "correct_name"
      | "clue"
      | "round"
      | "photo_url"
      | "display_order"
      | "distractors"
      | "aliases"
    >
  >
): Promise<Baby> {
  const { data, error } = await supabaseAdmin()
    .from("babies")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw dbError(error, "babies");
  return data as Baby;
}

export async function deleteBaby(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("babies").delete().eq("id", id);
  if (error) throw dbError(error, "babies");
}

export async function reorderBabies(orderedIds: string[]): Promise<void> {
  const client = supabaseAdmin();
  await Promise.all(
    orderedIds.map((id, index) =>
      client.from("babies").update({ display_order: index }).eq("id", id)
    )
  );
}
