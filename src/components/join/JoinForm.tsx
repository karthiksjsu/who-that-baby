"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPlayerToken, savePlayerSession } from "@/lib/player-session";

export function JoinForm({ onJoined }: { onJoined: (name: string) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      // Any token already on this device is sent so a returning guest lands
      // back on their own game; a new one is issued by the server, never here.
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, client_token: getPlayerToken() ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      savePlayerSession(data.player.client_token, data.player.name, data.player.id);
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
          className="h-14 text-lg"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={loading || !name.trim()}
        className="h-14 text-lg font-semibold"
      >
        {loading ? "Joining…" : "Let's play 🍼"}
      </Button>
    </form>
  );
}
