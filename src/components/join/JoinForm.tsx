"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePlayerSession } from "@/lib/player-session";

export function JoinForm({ onJoined }: { onJoined: (name: string) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const token = crypto.randomUUID();
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, client_token: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      savePlayerSession(token, data.player.name, data.player.id);
      onJoined(data.player.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't join right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          autoFocus
          placeholder="e.g. Priya"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          className="h-12 text-base"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={loading || !name.trim()}
        className="h-12 gap-2 text-base font-semibold"
      >
        {loading ? "Joining…" : (
          <>
            Let&apos;s play
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
