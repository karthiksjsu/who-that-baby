"use client";

import { useState } from "react";
import { BabyForm } from "@/components/admin/BabyForm";
import { BabyList } from "@/components/admin/BabyList";
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Manage the game</h1>
        <p className="text-sm text-muted-foreground">
          Upload baby photos, then flip the game live when everyone&apos;s ready.
        </p>
      </div>

      <StatusToggle status={status} onChange={setStatus} />

      {babies.length < 4 && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Add at least 4 babies so multiple-choice guesses have enough options.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <BabyForm onCreated={(baby) => setBabies((prev) => [...prev, baby])} />
        <BabyList babies={babies} onChange={setBabies} />
      </div>
    </div>
  );
}
