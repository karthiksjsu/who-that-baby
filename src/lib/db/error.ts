import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Turns a Supabase error into a real `Error` before it is thrown.
 *
 * `PostgrestError` is a plain object, not an `Error`. Throwing it directly
 * means React's error boundary and the Next overlay have no `.message` to
 * read, so a precise complaint like "column game_settings.current_round does
 * not exist" surfaces as an opaque `{code: "42703", message: ...}` blob and
 * you go hunting. Flattening code, details and hint into the message keeps the
 * useful part visible wherever the error ends up.
 */
export function dbError(error: PostgrestError, context: string): Error {
  const parts = [error.message, error.details, error.hint].filter(Boolean);
  const wrapped = new Error(`${context}: ${parts.join(" — ")} [${error.code}]`);
  wrapped.name = "SupabaseError";
  return wrapped;
}

/** Throws a legible error if the query failed; otherwise returns the data. */
export function unwrap<T>(
  result: { data: T; error: PostgrestError | null },
  context: string
): T {
  if (result.error) throw dbError(result.error, context);
  return result.data;
}
