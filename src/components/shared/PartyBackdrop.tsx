"use client";

import { motion } from "framer-motion";

interface Orb {
  className: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

const ORBS: Orb[] = [
  { className: "-left-24 -top-20", size: 340, color: "oklch(0.75 0.19 350 / 0.55)", duration: 14, delay: 0 },
  { className: "-right-28 top-10", size: 300, color: "oklch(0.7 0.2 280 / 0.5)", duration: 17, delay: 1 },
  { className: "-bottom-28 -left-16", size: 320, color: "oklch(0.78 0.18 240 / 0.45)", duration: 16, delay: 2 },
  { className: "-bottom-20 -right-20", size: 280, color: "oklch(0.8 0.17 60 / 0.5)", duration: 15, delay: 0.5 },
];

/**
 * Shared ambient background for full-bleed screens: soft drifting gradient
 * orbs (mesh-gradient look) plus a faint grain texture for tactility. No
 * literal emoji/clipart — the baby photos and typography carry the content.
 */
export function PartyBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          style={{ width: orb.size, height: orb.size, background: orb.color }}
          animate={{
            x: [0, 24, -16, 0],
            y: [0, -20, 14, 0],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
