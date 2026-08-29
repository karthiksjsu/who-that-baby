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
    className: "left-[4%] top-[36%] sm:left-[13%] sm:top-[31%]",
    size: "h-9 sm:h-14",
    delay: 0.9,
    duration: 7.2,
  },
  {
    Art: RattleIcon,
    className: "right-[4%] top-[34%] sm:right-[12%] sm:top-[29%]",
    size: "h-9 sm:h-14",
    delay: 1.4,
    duration: 6.4,
  },
];

/**
 * Positions are given phone-first, then moved for `sm` and up.
 *
 * On a phone the content column is the whole screen, so a piece parked in the
 * top tenth ends up behind the round badge and the timer — and these drift
 * through translucent pills, which turns the text to mush. The phone
 * positions keep the top band clear and hug the edges; the wider layout has
 * real margins, so it keeps the roomier original placement.
 */
const PIECES: FloatingPiece[] = [
  { emoji: "🍼", className: "left-[2%] top-[26%] sm:left-[6%] sm:top-[10%]", size: "text-4xl sm:text-6xl", delay: 0, duration: 6 },
  { emoji: "🎉", className: "right-[2%] top-[22%] sm:right-[8%] sm:top-[15%]", size: "text-3xl sm:text-5xl", delay: 0.4, duration: 7 },
  { emoji: "👶", className: "right-[2%] bottom-[20%]", size: "text-4xl sm:text-6xl", delay: 0.8, duration: 6.5 },
  { emoji: "✨", className: "left-[3%] bottom-[14%]", size: "text-2xl sm:text-4xl", delay: 1.2, duration: 5.5 },
  { emoji: "🧸", className: "left-[1%] top-[52%] sm:left-[2%] sm:top-[48%]", size: "text-3xl sm:text-5xl", delay: 0.6, duration: 7.5 },
  { emoji: "🎈", className: "right-[1%] top-[48%] sm:right-[2%] sm:top-[44%]", size: "text-3xl sm:text-5xl", delay: 1, duration: 6.8 },
  { emoji: "🍭", className: "left-[8%] bottom-[4%] sm:bottom-auto sm:left-[20%] sm:top-[4%]", size: "text-2xl sm:text-4xl", delay: 1.6, duration: 8 },
  { emoji: "🌟", className: "right-[16%] bottom-[6%] sm:right-[20%] sm:bottom-[8%]", size: "text-2xl sm:text-4xl", delay: 2, duration: 6.2 },
];

/**
 * Shared ambient background for full-bleed party-themed screens: blurred
 * color blobs plus floating emoji that drift and pulse gently. Rendered once
 * per page behind the main content (z-0), never intercepts clicks.
 *
 * The pieces are held back on phones — smaller, and half faded — because
 * there they sit under the content rather than beside it, and full-strength
 * emoji showing through the translucent pills made the round, timer and
 * progress labels hard to read.
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
            className="block opacity-45 drop-shadow-xl sm:opacity-100"
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
            className="opacity-45 drop-shadow-xl sm:opacity-100"
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
