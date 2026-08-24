"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function GameComplete() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card flex flex-col items-center gap-5 rounded-3xl p-8 text-center text-foreground"
    >
      <motion.span
        className="text-5xl"
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 12, delay: 0.1 }}
      >
        🎉
      </motion.span>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-bold">That&apos;s everyone!</h2>
        <p className="text-sm text-muted-foreground">
          You&apos;ve guessed every baby. Check the leaderboard to see how you stack up.
        </p>
      </div>
      <Button
        render={<Link href="/leaderboard" />}
        nativeButton={false}
        size="lg"
        className="h-12 w-full text-base font-semibold"
      >
        See leaderboard 🏆
      </Button>
    </motion.div>
  );
}
