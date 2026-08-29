"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";
import { clearPlayerSession } from "@/lib/player-session";
import { GAME_STATE_CHANNEL, GAME_STATE_EVENT } from "@/lib/realtime/channels";
import type { LiveState } from "@/types/db";

const POLL_MS = 2000;

/**
 * Follows the server's live game state.
 *
 * The client is a renderer, not a decision maker: it never picks which card is
 * up or when to move on. It polls `/api/game/state`, refetches on a realtime
 * nudge, and when its (skew-corrected) countdown reaches zero it asks the
 * server to advance. The server refuses if the deadline hasn't really passed,
 * so a phone with a fast clock can't drag the room forward.
 *
 * Polling runs alongside realtime on purpose. At a party, websockets drop on
 * phones that lock or switch networks, and a guest whose socket died must not
 * be stranded on a card the rest of the room has left.
 */
export function useLiveGame(token: string | null) {
  const [state, setState] = useState<LiveState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /**
   * serverNow - clientNow, in ms. Every deadline is shifted by this before it
   * is compared against the local clock, so a guest whose phone is a minute
   * fast still sees the same time remaining as everyone else.
   */
  const skewRef = useRef(0);
  const [skew, setSkew] = useState(0);
  /**
   * A guess this client has sent but the server hasn't echoed back yet.
   *
   * Without it the optimistic lock gets clobbered: a poll already in flight
   * when the player taps returns `my_guess: null` (it was computed before the
   * insert landed) and overwrites the local state, so the badge vanishes until
   * the following poll — a visible couple of seconds of nothing happening.
   */
  const pendingRef = useRef<{ cardId: string; name: string } | null>(null);
  const stateRef = useRef<LiveState | null>(null);
  // Mirrored into a ref in an effect (never during render) so the callbacks
  // below can read the latest state without listing it as a dependency and
  // restarting the poll on every tick.
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const fetchState = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `/api/game/state?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      if (res.status === 404) {
        clearPlayerSession();
        setExpired(true);
        return;
      }
      if (!res.ok) return;
      const next = (await res.json()) as LiveState;

      // Reconcile against a guess the server may not have caught up with.
      let merged = next;
      const pending = pendingRef.current;
      if (pending) {
        if (next.card?.id !== pending.cardId) {
          pendingRef.current = null; // room moved on; the guess is moot
        } else if (next.my_guess === null) {
          merged = { ...next, my_guess: pending.name }; // hold the lock
        } else {
          pendingRef.current = null; // server confirmed it
        }
      }

      const nextSkew = Date.parse(next.server_now) - Date.now();
      skewRef.current = nextSkew;
      // Only re-render on a meaningful correction; sub-second jitter on every
      // poll would otherwise churn the countdown.
      setSkew((prev) => (Math.abs(prev - nextSkew) > 500 ? nextSkew : prev));
      setState(merged);
      setError(null);
    } catch {
      // Swallow — the next poll retries. A dropped request mid-party should
      // not replace the card with an error screen.
    }
  }, [token]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, POLL_MS);

    let supabase: SupabaseClient | null = null;
    let sub: RealtimeChannel | null = null;
    try {
      supabase = supabaseBrowser();
      sub = supabase
        .channel(GAME_STATE_CHANNEL)
        .on("broadcast", { event: GAME_STATE_EVENT }, () => fetchState())
        .subscribe();
    } catch {
      // Polling above still covers us.
    }

    return () => {
      clearInterval(interval);
      if (supabase && sub) supabase.removeChannel(sub);
    };
  }, [fetchState]);

  /** Local-clock instant the current phase ends, or null if it never does. */
  const deadlineLocal = state?.deadline_at
    ? Date.parse(state.deadline_at) - skew
    : null;

  const requestAdvance = useCallback(async () => {
    const current = stateRef.current;
    if (!current) return;
    try {
      await fetch("/api/game/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expected_round: current.round,
          expected_index: current.index,
          expected_phase: current.phase,
        }),
      });
    } catch {
      // Someone else's client will get there; the poll will pick it up.
    } finally {
      fetchState();
    }
  }, [fetchState]);

  // Fire once per phase when the countdown runs out. Keyed on the position so
  // re-renders inside a phase don't re-trigger it.
  const firedFor = useRef<string>("");
  useEffect(() => {
    if (!state || deadlineLocal === null) return;
    const key = `${state.round}:${state.index}:${state.phase}`;
    const delay = Math.max(0, deadlineLocal - Date.now());
    const timer = setTimeout(() => {
      if (firedFor.current === key) return;
      firedFor.current = key;
      requestAdvance();
    }, delay);
    return () => clearTimeout(timer);
  }, [state, deadlineLocal, requestAdvance]);

  const submitGuess = useCallback(
    async (guessedName: string) => {
      const current = stateRef.current;
      if (!token || !current?.card || current.phase !== "question") return;
      if (current.my_guess) return;

      // Show the lock immediately, and remember it so an in-flight poll can't
      // undo it before the server has the row.
      pendingRef.current = { cardId: current.card.id, name: guessedName };
      setState((prev) => (prev ? { ...prev, my_guess: guessedName } : prev));
      setSubmitting(true);
      try {
        const res = await fetch("/api/game/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_token: token,
            baby_id: current.card.id,
            guessed_name: guessedName,
          }),
        });
        if (res.status === 404) {
          clearPlayerSession();
          setExpired(true);
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // 409 means the room moved on or they had already answered; the
          // lock stands either way. Anything else failed to record, so give
          // the buttons back rather than stranding them on a fake lock.
          if (res.status !== 409) {
            pendingRef.current = null;
            setState((prev) => (prev ? { ...prev, my_guess: null } : prev));
            setError(data.error ?? "Couldn't submit that guess.");
          }
          fetchState();
        }
      } catch {
        pendingRef.current = null;
        setState((prev) => (prev ? { ...prev, my_guess: null } : prev));
        setError("Couldn't reach the game. Retrying…");
        fetchState();
      } finally {
        setSubmitting(false);
      }
    },
    [token, fetchState]
  );

  return {
    state,
    error,
    expired,
    submitting,
    deadlineLocal,
    submitGuess,
    refetch: fetchState,
  };
}
