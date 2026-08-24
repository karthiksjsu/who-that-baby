"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BonusRoundIntro({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card flex flex-col items-center gap-5 rounded-3xl p-8 text-center text-foreground"
    >
      <motion.div
        className="flex size-16 items-center justify-center rounded-2xl bg-primary/10"
        animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
      >
        <Sparkles className="size-8 text-primary" strokeWidth={1.75} />
      </motion.div>
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
