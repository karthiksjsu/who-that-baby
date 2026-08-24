"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-party-gradient px-6 text-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-white/95 p-8 shadow-xl">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="size-7 text-destructive" strokeWidth={1.75} />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-bold">Something went sideways</h1>
          <p className="text-sm text-muted-foreground">
            That&apos;s on us, not you. Give it another try.
          </p>
        </div>
        <Button onClick={() => reset()} size="lg" className="h-11 w-full">
          Try again
        </Button>
      </div>
    </main>
  );
}
