"use client";

import { useState } from "react";
import { Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { BabyForm } from "@/components/admin/BabyForm";
import { BabyList } from "@/components/admin/BabyList";
import { ResetGameButton } from "@/components/admin/ResetGameButton";
import { StatusToggle } from "@/components/admin/StatusToggle";
import type { Baby, GameSettings } from "@/types/db";

export function DashboardClient({
  initialBabies,
  initialSettings,
}: {
  initialBabies: Baby[];
  initialSettings: GameSettings;
}) {
  const [babies, setBabies] = useState(initialBabies);
  const [status, setStatus] = useState(initialSettings.status);

  const mcqBabies = babies.filter((b) => b.round === "choice");
  const bonusBabies = babies.filter((b) => b.round === "bonus");

  function replaceGroup(round: "choice" | "bonus", next: Baby[]) {
    setBabies((prev) => [...prev.filter((b) => b.round !== round), ...next]);
  }

  async function moveRound(id: string, to: "choice" | "bonus") {
    setBabies((prev) => prev.map((b) => (b.id === id ? { ...b, round: to } : b)));
    const res = await fetch(`/api/admin/babies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round: to }),
    });
    if (!res.ok) {
      toast.error("Couldn't move that baby.");
      setBabies((prev) => prev.map((b) => (b.id === id ? { ...b, round: to === "choice" ? "bonus" : "choice" } : b)));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Manage the game</h1>
        <p className="text-sm text-muted-foreground">
          Upload baby photos, then flip the game live when everyone&apos;s ready.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <StatusToggle status={status} onChange={setStatus} />
        </div>
        <ResetGameButton onReset={setStatus} />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Target className="size-5 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Main round · multiple choice</h2>
            <p className="text-sm text-muted-foreground">
              Every player sees these first, picking the name from a few options.
            </p>
          </div>
        </div>
        {mcqBabies.length < 4 && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Add at least 4 babies here so multiple-choice guesses have enough options.
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
          <BabyForm
            round="choice"
            onCreated={(baby) => setBabies((prev) => [...prev, baby])}
          />
          <BabyList
            babies={mcqBabies}
            emptyLabel="No main-round babies yet. Upload one to the left!"
            moveLabel="Move to bonus round"
            showClue={false}
            onChange={(next) => replaceGroup("choice", next)}
            onMoveRound={(id) => moveRound(id, "bonus")}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="size-5 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Bonus round · free text</h2>
            <p className="text-sm text-muted-foreground">
              Unlocked after the main round — players type each name from scratch.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
          <BabyForm
            round="bonus"
            onCreated={(baby) => setBabies((prev) => [...prev, baby])}
          />
          <BabyList
            babies={bonusBabies}
            emptyLabel="No bonus-round babies yet. Upload one to the left!"
            moveLabel="Move to main round"
            showClue
            onChange={(next) => replaceGroup("bonus", next)}
            onMoveRound={(id) => moveRound(id, "choice")}
          />
        </div>
      </section>
    </div>
  );
}
