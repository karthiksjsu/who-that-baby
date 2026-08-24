import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { getGameSettings } from "@/lib/db/settings";

export const GET = apiRoute(async () => {
  const settings = await getGameSettings();
  return NextResponse.json({ settings });
});
