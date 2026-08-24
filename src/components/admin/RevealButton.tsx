"use client";

import { useState } from "react";
import { PartyPopper, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RevealButton({
  winnerRevealed,
  onRevealed,
}: {
  winnerRevealed: boolean;
  onRevealed: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleReveal() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed", winner_revealed: true }),
      });
      if (!res.ok) throw new Error();
      onRevealed();
    } catch {
      toast.error("Couldn't reveal the winner.");
    } finally {
      setLoading(false);
    }
  }

  if (winnerRevealed) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-700">
        <Trophy className="size-4 shrink-0" strokeWidth={2} />
        Winner has been revealed to everyone!
      </p>
    );
  }

  return (
    <Button
      onClick={handleReveal}
      disabled={loading}
      size="lg"
      className="h-12 w-full gap-2 text-base font-semibold"
    >
      <PartyPopper className="size-4" />
      {loading ? "Revealing…" : "Reveal Winner"}
    </Button>
  );
}
