import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { createPlayer, getPlayerByToken } from "@/lib/db/players";

export const POST = apiRoute(async (request) => {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const clientToken = typeof body.client_token === "string" ? body.client_token : "";

  if (!name) {
    return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }
  if (!clientToken) {
    return NextResponse.json({ error: "Missing client_token." }, { status: 400 });
  }

  const existing = await getPlayerByToken(clientToken);
  if (existing) {
    return NextResponse.json({ player: existing });
  }

  const player = await createPlayer(name, clientToken);
  return NextResponse.json({ player }, { status: 201 });
});
