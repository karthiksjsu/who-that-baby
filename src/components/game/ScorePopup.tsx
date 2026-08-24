"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";

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
        animate={{ opacity: 1, y: -14, scale: 1.1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className={
          "pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-base font-extrabold shadow-lg " +
          (isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white")
        }
      >
        {isCorrect ? (
          <>
            <Check className="size-5" strokeWidth={2.5} />
            {`+${points}`}
          </>
        ) : (
          <>
            <X className="size-5" strokeWidth={2.5} />
            Not quite
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
