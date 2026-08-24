"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function BonusRoundIntro({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 rounded-3xl bg-white/95 p-8 text-center text-foreground shadow-xl"
    >
      <span className="text-5xl">✨</span>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-bold">Bonus round unlocked!</h2>
        <p className="text-sm text-muted-foreground">
          Same babies, no multiple choice this time — type each name from scratch for extra
          points.
        </p>
      </div>
      <Button onClick={onStart} size="lg" className="h-12 w-full text-base font-semibold">
        Start bonus round
      </Button>
    </motion.div>
  );
}
