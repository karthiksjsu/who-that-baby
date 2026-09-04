"use client";

import { useMemo, useState } from "react";
import { optionDistribution } from "@/lib/game/distribution";
import { cn } from "@/lib/utils";
import type { Baby } from "@/types/db";

/**
 * Which names the room will actually read, and how often.
 *
 * Recomputed from the current baby list on every render rather than stored, so
 * it stays truthful the moment a photo is added, deleted, moved between rounds
 * or has its wrong answers pinned. It uses the same `buildChoices` the server
 * does, seeded the same way, so these are the real option sets and not a
 * simulation of them.
 */
export function OptionDistribution({
  babies,
  choicesCount,
}: {
  babies: Baby[];
  choicesCount: number;
}) {
  const [open, setOpen] = useState(false);
  const report = useMemo(
    () => optionDistribution(babies, choicesCount),
    [babies, choicesCount]
  );

  if (report.choiceCards === 0) return null;

  const { rows, neverDecoy, neverSeen, choiceCards, pinnedCards } = report;
  const decoySlots = choiceCards * Math.max(0, choicesCount - 1);
  /* What a name's decoy count would be if the load were spread perfectly. */
  const evenShare = rows.length > 1 ? decoySlots / (rows.length - 1) : 0;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-start justify-between gap-3 text-left"
      >
        <div>
          <h2 className="font-display text-lg font-bold">📊 Where each name appears</h2>
          <p className="text-sm text-muted-foreground">
            {choiceCards} crawl {choiceCards === 1 ? "card" : "cards"} ·{" "}
            {decoySlots} wrong-answer {decoySlots === 1 ? "slot" : "slots"} ·{" "}
            {pinnedCards} pinned by hand
          </p>
        </div>
        <span className="shrink-0 pt-1 text-sm text-muted-foreground">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {neverSeen.length > 0 && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>{neverSeen.length}</strong>{" "}
          {neverSeen.length === 1 ? "name never appears" : "names never appear"} on any
          card at all: {neverSeen.join(", ")}.
        </p>
      )}

      {neverDecoy.length > 0 && (
        <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">
          <strong>{neverDecoy.length}</strong>{" "}
          {neverDecoy.length === 1 ? "name is" : "names are"} never offered as a wrong
          answer, so the room only reads {neverDecoy.length === 1 ? "it" : "them"} on{" "}
          {neverDecoy.length === 1 ? "its" : "their"} own card: {neverDecoy.join(", ")}.
        </p>
      )}

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 text-right font-medium">Answer</th>
                <th className="py-2 pr-3 text-right font-medium">Wrong option</th>
                <th className="py-2 pr-3 text-right font-medium">Total</th>
                <th className="py-2 font-medium">Spread</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const width =
                  decoySlots > 0 ? Math.min(100, (r.asDecoy / Math.max(1, evenShare * 2)) * 100) : 0;
                return (
                  <tr key={r.name} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5 pr-3">
                      <span className="font-medium">{r.name}</span>
                      {r.bonusOnly && (
                        <span className="ml-2 text-xs text-muted-foreground">walk round</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.asAnswer}</td>
                    <td
                      className={cn(
                        "py-1.5 pr-3 text-right tabular-nums",
                        r.asDecoy === 0 && "font-medium text-amber-700"
                      )}
                    >
                      {r.asDecoy}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.total}</td>
                    <td className="py-1.5">
                      {/* Full bar = twice an even share, so over-used names
                          visibly run past the halfway point. */}
                      <span className="flex h-1.5 w-full min-w-24 overflow-hidden rounded-full bg-muted">
                        <span
                          className={cn(
                            "h-full rounded-full",
                            r.asDecoy === 0 ? "bg-amber-400" : "bg-primary"
                          )}
                          style={{ width: `${Math.max(r.asDecoy === 0 ? 0 : 4, width)}%` }}
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            Sorted by how rarely a name is seen. An even spread would give each name
            about {evenShare.toFixed(1)} wrong-answer{" "}
            {evenShare === 1 ? "slot" : "slots"}; the bar fills at twice that.
          </p>
        </div>
      )}
    </section>
  );
}
