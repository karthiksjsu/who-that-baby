import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { deleteBaby, updateBaby } from "@/lib/db/babies";
import type { GameRound } from "@/types/db";

export const PATCH = apiRoute(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const patch: { correct_name?: string; clue?: string | null; round?: GameRound } = {};
    if (typeof body.correct_name === "string" && body.correct_name.trim()) {
      patch.correct_name = body.correct_name.trim();
    }
    if (typeof body.clue === "string") {
      patch.clue = body.clue.trim() ? body.clue.trim() : null;
    }
    if (body.round === "choice" || body.round === "bonus") {
      patch.round = body.round;
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
