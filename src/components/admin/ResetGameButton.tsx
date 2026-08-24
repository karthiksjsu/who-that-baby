"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GameStatus } from "@/types/db";

export function ResetGameButton({ onReset }: { onReset: (status: GameStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't reset the game.");
      onReset(data.settings.status as GameStatus);
      setOpen(false);
      toast.success("Game reset — everyone's scores are cleared.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Reset game</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset the game?</DialogTitle>
          <DialogDescription>
            This clears every player and their scores, and sets the game back to Draft. Your
            baby photos and names are kept. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={handleReset}
            className="h-10"
          >
            {loading ? "Resetting…" : "Yes, reset everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
