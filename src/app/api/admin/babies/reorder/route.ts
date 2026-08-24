import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { reorderBabies } from "@/lib/db/babies";

export const POST = apiRoute(async (request) => {
  const body = await request.json().catch(() => ({}));
  const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : null;
  if (!orderedIds) {
    return NextResponse.json({ error: "Expected orderedIds: string[]" }, { status: 400 });
  }
  await reorderBabies(orderedIds);
  return NextResponse.json({ ok: true });
});
