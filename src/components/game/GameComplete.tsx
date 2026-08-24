"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PartyPopper, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GameComplete() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card flex flex-col items-center gap-5 rounded-3xl p-8 text-center text-foreground"
    >
      <motion.div
        className="flex size-16 items-center justify-center rounded-2xl bg-primary/10"
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 12, delay: 0.1 }}
      >
        <PartyPopper className="size-8 text-primary" strokeWidth={1.75} />
      </motion.div>
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
        className="h-12 w-full gap-2 text-base font-semibold"
      >
        <Trophy className="size-4" />
        See leaderboard
      </Button>
    </motion.div>
  );
}
