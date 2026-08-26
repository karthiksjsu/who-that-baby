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
        initial={{ opacity: 0, y: 10, scale: 0.6, rotate: isCorrect ? -8 : 8 }}
        animate={{ opacity: 1, y: -18, scale: 1.25, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className={
          "pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full px-6 py-3 text-lg font-extrabold shadow-lg " +
          (isCorrect
            ? "bg-emerald-500 text-white"
            : "bg-red-500 text-white")
        }
      >
        {isCorrect ? `+${points} 🎉` : "Not quite! 😬"}
      </motion.div>
    </AnimatePresence>
  );
}
