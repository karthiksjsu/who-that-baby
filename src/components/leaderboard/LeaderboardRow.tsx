"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LeaderboardRow as LeaderboardRowType } from "@/types/db";

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_STYLES = [
  "bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-900",
  "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800",
  "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900",
];

export function LeaderboardRow({
  row,
  rank,
  highlight,
}: {
  row: LeaderboardRowType;
  rank: number;
  highlight?: boolean;
}) {
  const isTopThree = rank <= 3;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={cn(
        "glass-card flex items-center gap-3.5 rounded-2xl px-4 py-3.5",
        rank === 1 && "ring-2 ring-amber-400",
        highlight && rank !== 1 && "ring-2 ring-primary"
      )}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full text-2xl font-bold shadow-sm",
          isTopThree ? RANK_STYLES[rank - 1] : "bg-muted text-base text-muted-foreground"
        )}
      >
        {isTopThree ? MEDALS[rank - 1] : rank}
      </span>
      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="truncate text-lg font-semibold">{row.name}</span>
        <span className="text-xs text-muted-foreground">
          {row.answered_count} guess{row.answered_count === 1 ? "" : "es"}
        </span>
      </div>
      <span className="font-display text-2xl font-bold text-primary">{row.score}</span>
    </motion.li>
  );
}
