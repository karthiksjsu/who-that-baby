import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Baby, GameRound } from "@/types/db";

export async function listBabies(round?: GameRound): Promise<Baby[]> {
  let query = supabaseAdmin().from("babies").select("*");
  if (round) query = query.eq("round", round);
  const { data, error } = await query.order("display_order", { ascending: true });
  if (error) throw error;
  return data as Baby[];
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
  if (error) throw error;
  return data as Baby;
}

export async function updateBaby(
  id: string,
  patch: Partial<Pick<Baby, "correct_name" | "clue" | "round" | "photo_url" | "display_order">>
): Promise<Baby> {
  const { data, error } = await supabaseAdmin()
    .from("babies")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Baby;
}

export async function deleteBaby(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("babies").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderBabies(orderedIds: string[]): Promise<void> {
  const client = supabaseAdmin();
  await Promise.all(
    orderedIds.map((id, index) =>
      client.from("babies").update({ display_order: index }).eq("id", id)
    )
  );
}
