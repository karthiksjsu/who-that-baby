"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LeaderboardRow as LeaderboardRowType } from "@/types/db";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardRow({
  row,
  rank,
  highlight,
}: {
  row: LeaderboardRowType;
  rank: number;
  highlight?: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3",
        highlight ? "border-primary bg-primary/5" : "border-border bg-white"
      )}
    >
      <span className="w-8 shrink-0 text-center text-lg font-bold text-muted-foreground">
        {MEDALS[rank - 1] ?? rank}
      </span>
      <div className="flex flex-1 flex-col">
        <span className="font-semibold">{row.name}</span>
        <span className="text-xs text-muted-foreground">
          {row.answered_count} guess{row.answered_count === 1 ? "" : "es"}
        </span>
      </div>
      <span className="font-display text-lg font-bold text-primary">{row.score}</span>
    </motion.li>
  );
}
