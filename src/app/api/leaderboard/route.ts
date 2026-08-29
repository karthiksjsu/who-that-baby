import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { getLeaderboard } from "@/lib/db/guesses";

/**
 * Never cache this. It is polled continuously and must always reflect the
 * database right now; a cached response leaves the room stuck on a stale phase
 * until someone reloads the page.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = apiRoute(async () => {
  const leaderboard = await getLeaderboard();
  return NextResponse.json({ leaderboard });
});
