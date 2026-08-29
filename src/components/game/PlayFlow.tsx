"use client";

import { LiveGame } from "@/components/game/LiveGame";

/**
 * The game is synchronized across the room, so there is no per-player stage
 * machine here any more: which round is running, when the walk-round intro
 * shows and when the game is over are all server state, and `LiveGame` renders
 * whichever phase is current.
 *
 * The wrapper is still load-bearing. `/play` puts this inside a full-width
 * column, and every screen `LiveGame` renders is width-capped, so without the
 * centering here they pin to the left edge.
 */
export function PlayFlow({ token }: { token: string }) {
  return (
    <div className="flex w-full flex-col items-center">
      <LiveGame token={token} />
    </div>
  );
}
