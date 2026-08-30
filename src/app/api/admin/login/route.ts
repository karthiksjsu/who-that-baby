import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import {
  ADMIN_COOKIE_MAX_AGE_SECONDS,
  ADMIN_COOKIE_NAME,
  checkAdminPasscode,
  createAdminSessionToken,
} from "@/lib/auth/admin";

/**
 * Slow enough that guessing the passcode is not an evening's entertainment.
 *
 * The passcode is the whole of the admin's security, and admin is where every
 * answer is listed — so a guest who is already on the wifi, already on the
 * site, and mildly bored is exactly the threat here. Ten tries a minute from
 * one address leaves an honest host with fat fingers unbothered and makes a
 * dictionary run pointless.
 */
const ATTEMPTS = 10;
const WINDOW_MS = 60_000;

export const POST = apiRoute(async (request) => {
  const limit = rateLimit(`admin-login:${clientIp(request)}`, ATTEMPTS, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!passcode || !checkAdminPasscode(passcode)) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, await createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
  });
  return res;
});
