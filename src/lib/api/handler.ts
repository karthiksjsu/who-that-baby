import "server-only";
import { NextResponse } from "next/server";

/**
 * Wraps a route handler so any thrown error (Supabase misconfig, network
 * blip, etc.) becomes a JSON error response instead of Next's default HTML
 * error page — clients always get `{ error }` to show, never a JSON-parse
 * crash on the response body.
 */
export function apiRoute<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<Response>
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(request, ...args);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
