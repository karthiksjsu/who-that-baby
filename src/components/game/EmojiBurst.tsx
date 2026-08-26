"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CORRECT_EMOJI = ["🎉", "✨", "🥳", "💯", "⭐", "🙌"];
const WRONG_EMOJI = ["😅", "🤔", "👀", "😬"];

interface Piece {
  emoji: string;
  x: number;
  y: number;
  rotate: number;
  delay: number;
  scale: number;
}

function generatePieces(variant: "correct" | "wrong"): Piece[] {
  const pool = variant === "correct" ? CORRECT_EMOJI : WRONG_EMOJI;
  const count = variant === "correct" ? 10 : 6;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 70 + Math.random() * 70;
    return {
      emoji: pool[i % pool.length],
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      rotate: (Math.random() - 0.5) * 200,
      delay: Math.random() * 0.15,
      scale: 0.9 + Math.random() * 0.5,
    };
  });
}

/**
 * A one-shot radial burst of emoji, replayed each time `trigger` changes
 * (pass something like the card id so it fires fresh per guess). Purely
 * decorative — sits above the card, never blocks input. Particle positions
 * are randomized in an effect (not during render) to stay a pure component.
 */
export function EmojiBurst({
  trigger,
  variant,
}: {
  trigger: string;
  variant: "correct" | "wrong";
}) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(generatePieces(variant));
  }, [trigger, variant]);

  return (
    <div
      key={trigger}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl drop-shadow-lg"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.3, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotate }}
          transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}
