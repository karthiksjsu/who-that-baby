"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameSettings, Timings } from "@/types/db";

/**
 * The game-wide clocks.
 *
 * These were constants until a host wanted the walk round to breathe. They are
 * defaults rather than rules: a single card can be given its own answer time
 * from its row in the list, and doing so does not touch anything here.
 *
 * Editing is safe mid-party. Phase length is read fresh on every deadline
 * calculation and measured from `phase_started_at`, so a change lands on the
 * next card rather than retroactively expiring the one on screen — with one
 * exception worth knowing about, noted under the answer-time field.
 */
export function TimingsPanel({
  initial,
  onSaved,
}: {
  initial: Timings;
  onSaved?: (settings: GameSettings) => void;
}) {
  const [question, setQuestion] = useState(Math.round(initial.question_time_ms / 1000));
  const [reveal, setReveal] = useState(Math.round(initial.reveal_ms / 1000));
  const [intermission, setIntermission] = useState(
    Math.round(initial.intermission_ms / 1000)
  );
  const [busy, setBusy] = useState(false);

  const fields = [
    {
      key: "question" as const,
      label: "Answer time",
      hint: "Per card, unless that card sets its own",
      value: question,
      set: setQuestion,
      min: 3,
      max: 300,
    },
    {
      key: "reveal" as const,
      label: "Reveal",
      hint: "How long the answer stays up",
      value: reveal,
      set: setReveal,
      min: 1,
      max: 60,
    },
    {
      key: "intermission" as const,
      label: "Intermission",
      hint: "The between-rounds screen",
      value: intermission,
      set: setIntermission,
      min: 1,
      max: 120,
    },
  ];

  const invalid = fields.filter(
    (f) => !Number.isFinite(f.value) || f.value < f.min || f.value > f.max
  );

  const dirty =
    question !== Math.round(initial.question_time_ms / 1000) ||
    reveal !== Math.round(initial.reveal_ms / 1000) ||
    intermission !== Math.round(initial.intermission_ms / 1000);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_time_ms: question * 1000,
          reveal_ms: reveal * 1000,
          intermission_ms: intermission * 1000,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save those timings.");
      onSaved?.(data.settings as GameSettings);
      toast.success("Timings saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save those timings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4">
      <div>
        <h2 className="font-display text-lg font-bold">⏱ Timings</h2>
        <p className="text-sm text-muted-foreground">
          Defaults for every card. A single photo can override the answer time from its
          own row.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-sm font-medium">{f.label}</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={f.min}
                max={f.max}
                value={Number.isFinite(f.value) ? f.value : ""}
                disabled={busy}
                onChange={(e) => f.set(Number(e.target.value))}
                className="h-9 w-24"
              />
              <span className="text-xs text-muted-foreground">sec</span>
            </div>
            <span className="text-xs text-muted-foreground">{f.hint}</span>
          </label>
        ))}
      </div>

      {invalid.length > 0 && (
        <p className="text-xs text-destructive">
          {invalid
            .map((f) => `${f.label} must be ${f.min}–${f.max} seconds`)
            .join(". ")}
          .
        </p>
      )}

      {/*
        Shortening the answer clock while a card is already up can put its
        deadline in the past, and the next phone to poll will advance the room
        immediately. Lengthening is always safe. Said plainly here rather than
        blocked, because cutting a card short is sometimes exactly what a host
        wants when the room has clearly all answered.
      */}
      <p className="text-xs text-muted-foreground">
        Changes apply to the next card. Shortening the answer time while a question is
        live may end it straight away.
      </p>

      <div>
        <Button type="button" className="h-9" disabled={busy || !dirty || invalid.length > 0} onClick={save}>
          {busy ? "Saving…" : "Save timings"}
        </Button>
      </div>
    </section>
  );
}
