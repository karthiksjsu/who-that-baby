import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { listBabies } from "@/lib/db/babies";
import { getGuessesForPlayer } from "@/lib/db/guesses";
import { getPlayerByToken } from "@/lib/db/players";
import { getGameSettings } from "@/lib/db/settings";
import { buildChoices } from "@/lib/game/distractors";
import type { GameCard, GameRound } from "@/types/db";

export const GET = apiRoute(async (request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const round = (url.searchParams.get("round") ?? "choice") as GameRound;
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }
  if (round !== "choice" && round !== "bonus") {
    return NextResponse.json({ error: "Invalid round." }, { status: 400 });
  }

  const [player, settings, babies] = await Promise.all([
    getPlayerByToken(token),
    getGameSettings(),
    listBabies(round),
  ]);

  if (!player) {
    return NextResponse.json({ error: "Unknown player." }, { status: 404 });
  }
  if (settings.status === "draft") {
    return NextResponse.json({ error: "Game hasn't started yet." }, { status: 403 });
  }

  const guesses = await getGuessesForPlayer(player.id, round);
  const answeredBabyIds = new Set(guesses.map((g) => g.baby_id));
  const allNames = babies.map((b) => b.correct_name);

  const cards: GameCard[] = babies.map((baby) => ({
    id: baby.id,
    photo_url: baby.photo_url,
    order: baby.display_order,
    clue: baby.clue,
    answered: answeredBabyIds.has(baby.id),
    choices:
      round === "choice"
        ? buildChoices(baby.correct_name, allNames, settings.choices_count, `${player.id}:${baby.id}`)
        : null,
  }));

  return NextResponse.json({ cards, status: settings.status });
});
