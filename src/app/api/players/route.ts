import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { createPlayer, getPlayerByToken } from "@/lib/db/players";

/** One guest, one phone, a few fumbled attempts — not thirty sock puppets. */
const JOINS = 8;
const WINDOW_MS = 10 * 60_000;

export const POST = apiRoute(async (request) => {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const resumeToken = typeof body.client_token === "string" ? body.client_token : "";

  if (!name) {
    return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }

  // A token that already belongs to somebody is a returning guest — a reload,
  // or a phone that went to sleep — so hand back the player they already are.
  if (resumeToken) {
    const existing = await getPlayerByToken(resumeToken);
    if (existing) return NextResponse.json({ player: existing });
  }

  // Past here we are creating an identity, so the rate limit applies. Resuming
  // is deliberately outside it: a guest reloading a flaky page must never be
  // told they cannot come back to their own game.
  const limit = rateLimit(`join:${clientIp(request)}`, JOINS, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "That's a lot of players from one phone. Try again in a bit." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  // The token is minted here rather than accepted from the browser. It is the
  // only thing standing between a guest and somebody else's score, so its
  // randomness should not depend on what the client felt like sending — and
  // `crypto.randomUUID` in a browser needs a secure context, which a guest on
  // a hotspot may not have.
  const player = await createPlayer(name, crypto.randomUUID());
  return NextResponse.json({ player }, { status: 201 });
});
