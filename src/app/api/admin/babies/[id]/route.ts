import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { deleteBaby, updateBaby } from "@/lib/db/babies";
import type { GameRound } from "@/types/db";

export const PATCH = apiRoute(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const patch: {
      correct_name?: string;
      clue?: string | null;
      round?: GameRound;
      distractors?: string[] | null;
    } = {};
    if (typeof body.correct_name === "string" && body.correct_name.trim()) {
      patch.correct_name = body.correct_name.trim();
    }
    if (typeof body.clue === "string") {
      patch.clue = body.clue.trim() ? body.clue.trim() : null;
    }
    if (body.round === "choice" || body.round === "bonus") {
      patch.round = body.round;
    }
    // An empty list means "go back to picking them for me", which is null in
    // the column — storing `{}` there would serve a card with one lonely
    // option on it.
    if (Array.isArray(body.distractors)) {
      const names = body.distractors
        .filter((n: unknown): n is string => typeof n === "string")
        .map((n: string) => n.trim().slice(0, 80))
        .filter(Boolean);
      patch.distractors = names.length ? Array.from(new Set(names)) : null;
    } else if (body.distractors === null) {
      patch.distractors = null;
    }
    const baby = await updateBaby(id, patch);
    return NextResponse.json({ baby });
  }
);

export const DELETE = apiRoute(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await deleteBaby(id);
    return NextResponse.json({ ok: true });
  }
);
