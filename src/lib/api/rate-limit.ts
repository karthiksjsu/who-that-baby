import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window counters, held in the process.
 *
 * Deliberately not Redis or a table: this is a party game with a couple of
 * dozen guests, and the thing being defended against is a bored guest with a
 * phone, not a botnet. What it costs is exactness — serverless runs several
 * instances, so a determined attacker gets the limit times however many
 * instances they happen to land on, and a cold start forgets everything. That
 * still turns "spray the passcode as fast as HTTP allows" into something slow
 * enough to be useless over an evening, which is the whole job.
 */
const buckets = new Map<string, Bucket>();

/** Stops a long-running instance accumulating a key per attacker forever. */
const MAX_KEYS = 5000;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, bucket] of buckets) {
        if (now >= bucket.resetAt) buckets.delete(k);
      }
      // Still full of live windows: drop the oldest rather than grow without
      // bound. Losing a counter fails open, which is the right way round for a
      // game everyone in the room is trying to play.
      if (buckets.size >= MAX_KEYS) {
        const oldest = buckets.keys().next().value;
        if (oldest !== undefined) buckets.delete(oldest);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client address.
 *
 * Behind Vercel these headers are set by the platform and a client cannot
 * forge them; run anywhere that passes them through unchecked and they are
 * only a hint. Everything using this treats it that way — it decides how fast
 * someone may retry, never whether they are allowed in at all.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}
