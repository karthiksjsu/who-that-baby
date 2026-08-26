"use client";

import { useState } from "react";
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
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-700">
        🏆 Winner has been revealed to everyone!
      </p>
    );
  }

  return (
    <Button
      onClick={handleReveal}
      disabled={loading}
      size="lg"
      className="h-12 w-full text-base font-semibold"
    >
      {loading ? "Revealing…" : "Reveal Winner 🎉"}
    </Button>
  );
}
