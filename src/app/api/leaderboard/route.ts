import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { getLeaderboard } from "@/lib/db/guesses";

export const GET = apiRoute(async () => {
  const leaderboard = await getLeaderboard();
  return NextResponse.json({ leaderboard });
});
