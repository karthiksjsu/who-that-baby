"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GameStatus } from "@/types/db";

const STEPS: { value: GameStatus; label: string; hint: string }[] = [
  { value: "draft", label: "Draft", hint: "Guests can join but can't play yet" },
  { value: "live", label: "Live", hint: "Guests are guessing right now" },
  { value: "closed", label: "Closed", hint: "Guessing is locked in" },
];

export function StatusToggle({
  status,
  onChange,
}: {
  status: GameStatus;
  onChange: (status: GameStatus) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function setStatus(next: GameStatus) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      onChange(next);
      toast.success(`Game is now ${next}.`);
    } catch {
      toast.error("Couldn't update game status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-display text-lg font-bold">Game status</h2>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step) => (
          <Button
            key={step.value}
            type="button"
            disabled={loading}
            variant={status === step.value ? "default" : "outline"}
            className={cn("h-10")}
            onClick={() => setStatus(step.value)}
          >
            {step.label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {STEPS.find((s) => s.value === status)?.hint}
      </p>
    </div>
  );
}
