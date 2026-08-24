import "server-only";

/**
 * Sends a Realtime Broadcast message via Supabase's REST broadcast endpoint
 * instead of opening a websocket from a serverless function (which would need
 * a subscribe/send/cleanup dance on every request). Clients subscribe over
 * websocket as normal and receive this the same way.
 */
export async function broadcast(topic: string, event: string, payload: unknown = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars for broadcast.");

  const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ messages: [{ topic, event, payload, private: false }] }),
  });

  if (!res.ok) {
    // Non-fatal: the leaderboard/status still updates via polling fallback.
    console.error("Broadcast failed", res.status, await res.text().catch(() => ""));
  }
}
