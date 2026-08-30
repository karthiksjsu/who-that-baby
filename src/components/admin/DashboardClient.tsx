"use client";

import { useState } from "react";
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
  // Both rounds' names are fair game as wrong answers, so the pool is every
  // baby rather than only the ones in this section.
  const allNames = babies.map((b) => b.correct_name);

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
        <div>
          <h2 className="font-display text-xl font-bold">🎯 Crawl round · multiple choice</h2>
          <p className="text-sm text-muted-foreground">
            Every player sees these first, picking the name from a few options.
          </p>
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
            emptyLabel="No crawl-round babies yet. Upload one to the left!"
            moveLabel="Move to walk round"
            showClue={false}
            showOptions
            allNames={allNames}
            choicesCount={initialSettings.choices_count}
            onChange={(next) => replaceGroup("choice", next)}
            onMoveRound={(id) => moveRound(id, "bonus")}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">✨ Walk round · free text</h2>
          <p className="text-sm text-muted-foreground">
            Unlocked after the crawl round — players type each name from scratch.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
          <BabyForm
            round="bonus"
            onCreated={(baby) => setBabies((prev) => [...prev, baby])}
          />
          <BabyList
            babies={bonusBabies}
            emptyLabel="No walk-round babies yet. Upload one to the left!"
            moveLabel="Move to crawl round"
            showClue
            showOptions={false}
            showAliases
            allNames={allNames}
            choicesCount={initialSettings.choices_count}
            onChange={(next) => replaceGroup("bonus", next)}
            onMoveRound={(id) => moveRound(id, "choice")}
          />
        </div>
      </section>
    </div>
  );
}
