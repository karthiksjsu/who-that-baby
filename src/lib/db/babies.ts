import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Baby } from "@/types/db";

export async function listBabies(): Promise<Baby[]> {
  const { data, error } = await supabaseAdmin()
    .from("babies")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data as Baby[];
}

export async function createBaby(input: {
  photo_url: string;
  correct_name: string;
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
  patch: Partial<Pick<Baby, "correct_name" | "photo_url" | "display_order">>
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
