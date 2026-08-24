import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { listBabies } from "@/lib/db/babies";
import { getGuessesForPlayer } from "@/lib/db/guesses";
import { getPlayerByToken } from "@/lib/db/players";
import { getGameSettings } from "@/lib/db/settings";
import { buildChoices } from "@/lib/game/distractors";
import type { GameCard } from "@/types/db";

export const GET = apiRoute(async (request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const [player, settings, babies] = await Promise.all([
    getPlayerByToken(token),
    getGameSettings(),
    listBabies(),
  ]);

  if (!player) {
    return NextResponse.json({ error: "Unknown player." }, { status: 404 });
  }
  if (settings.status === "draft") {
    return NextResponse.json({ error: "Game hasn't started yet." }, { status: 403 });
  }

  const guesses = await getGuessesForPlayer(player.id);
  const answeredBabyIds = new Set(guesses.map((g) => g.baby_id));
  const allNames = babies.map((b) => b.correct_name);

  const cards: GameCard[] = babies.map((baby) => ({
    id: baby.id,
    photo_url: baby.photo_url,
    order: baby.display_order,
    answered: answeredBabyIds.has(baby.id),
    choices: buildChoices(
      baby.correct_name,
      allNames,
      settings.choices_count,
      `${player.id}:${baby.id}`
    ),
  }));

  return NextResponse.json({ cards, status: settings.status });
});
