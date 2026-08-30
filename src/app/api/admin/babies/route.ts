import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { createBaby, listBabies } from "@/lib/db/babies";
import { MAX_PHOTO_BYTES, uploadPhoto } from "@/lib/db/photos";
import type { GameRound } from "@/types/db";

/**
 * Never cache this. It is polled continuously and must always reflect the
 * database right now; a cached response leaves the room stuck on a stale phase
 * until someone reloads the page.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = apiRoute(async () => {
  const babies = await listBabies();
  return NextResponse.json({ babies });
});

export const POST = apiRoute(async (request) => {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("photo");
  const correctName = String(form.get("correct_name") ?? "").trim();
  const round: GameRound = form.get("round") === "bonus" ? "bonus" : "choice";
  const clueRaw = String(form.get("clue") ?? "").trim();
  const clue = clueRaw ? clueRaw : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing photo file." }, { status: 400 });
  }
  if (!correctName) {
    return NextResponse.json({ error: "Missing correct_name." }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Photo is too large (max 8MB)." }, { status: 400 });
  }

  const uploaded = await uploadPhoto(file);
  if ("error" in uploaded) {
    return NextResponse.json({ error: uploaded.error }, { status: uploaded.status });
  }

  const existing = await listBabies();
  const nextOrder = existing.length
    ? Math.max(...existing.map((b) => b.display_order)) + 1
    : 0;

  const baby = await createBaby({
    photo_url: uploaded.url,
    correct_name: correctName,
    clue,
    round,
    display_order: nextOrder,
  });

  return NextResponse.json({ baby }, { status: 201 });
});
