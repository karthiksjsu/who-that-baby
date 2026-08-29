"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import { PacifierIcon, RattleIcon } from "@/components/shared/NurseryArt";

interface FloatingPiece {
  emoji: string;
  className: string;
  size: string;
  delay: number;
  duration: number;
}

/**
 * Drawn rather than emoji, because Unicode has neither a pacifier nor a
 * rattle. They drift on the same animation as the emoji pieces so the two
 * kinds read as one set.
 */
interface DrawnPiece {
  Art: (props: { className?: string }) => ReactElement;
  className: string;
  size: string;
  delay: number;
  duration: number;
}

const DRAWN_PIECES: DrawnPiece[] = [
  {
    Art: PacifierIcon,
    className: "-left-[3%] top-[26%] sm:left-[13%] sm:top-[31%]",
    size: "h-14",
    delay: 0.9,
    duration: 7.2,
  },
  {
    Art: RattleIcon,
    className: "-right-[3%] top-[22%] sm:right-[12%] sm:top-[29%]",
    size: "h-14",
    delay: 1.4,
    duration: 6.4,
  },
];

/**
 * Same pieces at the same size everywhere — only where they sit changes.
 *
 * A phone has no margins to spare: the game column is the whole screen, so
 * the original placements put the big pieces right behind the round badge,
 * the timer and the progress labels, and a lollipop across a word is a
 * lollipop across a word. The phone placements use the gaps the game leaves
 * instead — the pocket along the top between the badge and the timer, and
 * the screen edges, where a piece drifts half in view beside the photo. From
 * `sm` up there are real margins again, so the roomier original placement
 * comes back.
 */
const PIECES: FloatingPiece[] = [
  { emoji: "🍼", className: "left-[41%] top-[3%] sm:left-[6%] sm:top-[10%]", size: "text-6xl", delay: 0, duration: 6 },
  { emoji: "🎉", className: "left-[63%] top-[2%] sm:left-auto sm:right-[8%] sm:top-[15%]", size: "text-5xl", delay: 0.4, duration: 7 },
  { emoji: "👶", className: "-right-[3%] bottom-[20%] sm:right-[4%]", size: "text-6xl", delay: 0.8, duration: 6.5 },
  { emoji: "✨", className: "-left-[1%] bottom-[13%] sm:left-[8%] sm:bottom-[14%]", size: "text-4xl", delay: 1.2, duration: 5.5 },
  { emoji: "🧸", className: "-left-[4%] top-[62%] sm:left-[2%] sm:top-[48%]", size: "text-5xl", delay: 0.6, duration: 7.5 },
  { emoji: "🎈", className: "-right-[4%] top-[44%] sm:right-[2%]", size: "text-5xl", delay: 1, duration: 6.8 },
  { emoji: "🍭", className: "left-[27%] top-[7%] sm:left-[20%] sm:top-[4%]", size: "text-4xl", delay: 1.6, duration: 8 },
  { emoji: "🌟", className: "-left-[2%] top-[42%] sm:left-auto sm:right-[20%] sm:bottom-[8%] sm:top-auto", size: "text-4xl", delay: 2, duration: 6.2 },
];

/**
 * Shared ambient background for full-bleed party-themed screens: blurred
 * color blobs plus fully-opaque floating emoji that drift and pulse gently.
 * Rendered once per page behind the main content (z-0), never intercepts
 * clicks.
 */
export function PartyBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 -top-24 size-96 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -bottom-28 -right-20 size-[28rem] rounded-full bg-white/15 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 size-80 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

      {PIECES.map((piece, i) => (
        <motion.div
          key={i}
          className={`absolute ${piece.className} ${piece.size}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: piece.delay }}
        >
          <motion.span
            className="block drop-shadow-xl"
            animate={{
              y: [0, -18, 0],
              rotate: [0, 8, -8, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: piece.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: piece.delay,
            }}
          >
            {piece.emoji}
          </motion.span>
        </motion.div>
      ))}

      {DRAWN_PIECES.map((piece, i) => (
        <motion.div
          key={`drawn-${i}`}
          className={`absolute ${piece.className}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: piece.delay }}
        >
          <motion.div
            className="drop-shadow-xl"
            animate={{
              y: [0, -18, 0],
              rotate: [0, 8, -8, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: piece.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: piece.delay,
            }}
          >
            <piece.Art className={`${piece.size} w-auto`} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
