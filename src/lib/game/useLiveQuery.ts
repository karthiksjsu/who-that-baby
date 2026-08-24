"use client";

import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Polls `fetcher` on an interval and also refetches immediately whenever a
 * Realtime broadcast lands on `channel`/`event` — the broadcast is just a
 * "something changed, go refetch" nudge, never carries the source of truth.
 * The interval is a belt-and-suspenders fallback for a live party where the
 * websocket dropping on someone's phone must not stall their leaderboard.
 */
export function useLiveQuery<T>(
  fetcher: () => Promise<T>,
  channel: string,
  event: string,
  intervalMs = 6000
) {
  const [data, setData] = useState<T | null>(null);

  const refetch = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
    } catch {
      // Swallow — next poll/broadcast will retry.
    }
  }, [fetcher]);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, intervalMs);

    // Realtime is a nice-to-have nudge on top of polling — if the client
    // can't even be constructed (bad/missing env config) or the socket
    // fails, keep the polling fallback running rather than taking the page
    // down with an uncaught error.
    let supabase: SupabaseClient | null = null;
    let sub: RealtimeChannel | null = null;
    try {
      supabase = supabaseBrowser();
      sub = supabase
        .channel(channel)
        .on("broadcast", { event }, () => refetch())
        .subscribe();
    } catch {
      // Polling fallback above still covers us.
    }

    return () => {
      clearInterval(interval);
      if (supabase && sub) supabase.removeChannel(sub);
    };
  }, [channel, event, intervalMs, refetch]);

  return { data, refetch };
}
