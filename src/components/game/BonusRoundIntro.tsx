"use client";

import { motion } from "framer-motion";

export function BonusRoundIntro() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card flex flex-col items-center gap-5 rounded-3xl p-8 text-center text-foreground"
    >
      <motion.span
        className="text-7xl"
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
      >
        ✨
      </motion.span>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-3xl font-bold">Time to walk!</h2>
        <p className="text-sm text-muted-foreground">
          You crawled through the easy ones. No multiple choice from here — type each
          name from scratch. Every one you get right is worth 25 instead of 10.
        </p>
      </div>
      <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
        Starting automatically…
      </p>
    </motion.div>
  );
}
