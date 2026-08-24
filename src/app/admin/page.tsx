"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PartyBackdrop } from "@/components/shared/PartyBackdrop";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Incorrect passcode.");
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-party-gradient px-6">
      <PartyBackdrop />
      <form
        onSubmit={handleSubmit}
        className="glass-card relative z-10 flex w-full max-w-sm flex-col gap-4 rounded-3xl p-8"
      >
        <div className="flex flex-col items-center gap-2 pb-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRound className="size-6 text-primary" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-xl font-bold">Host Login</h1>
          <p className="text-sm text-muted-foreground">Enter the game passcode</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="passcode">Passcode</Label>
          <Input
            id="passcode"
            type="password"
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <Button type="submit" size="lg" disabled={loading || !passcode} className="h-12">
          {loading ? "Checking…" : "Enter"}
        </Button>
      </form>
    </main>
  );
}
