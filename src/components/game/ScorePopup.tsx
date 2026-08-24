"use client";

import { AnimatePresence, motion } from "framer-motion";

export function ScorePopup({
  isCorrect,
  points,
}: {
  isCorrect: boolean;
  points: number;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: -10, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={
          "pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm font-bold shadow-lg " +
          (isCorrect
            ? "bg-emerald-500 text-white"
            : "bg-red-500 text-white")
        }
      >
        {isCorrect ? `+${points} 🎉` : "Not quite!"}
      </motion.div>
    </AnimatePresence>
  );
}
