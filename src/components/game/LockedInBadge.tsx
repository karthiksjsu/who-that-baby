"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Cycled while a player waits out the clock. Several lines rather than one
 * because the question phase runs 30 seconds and a single frozen sentence
 * makes the game feel stalled — the rotation is the only thing on screen
 * telling them it hasn't hung.
 */
const LINES = [
  { emoji: "🤫", text: "Shhh… others still guessing" },
  { emoji: "🍼", text: "Answer tucked in the crib" },
  { emoji: "🧦", text: "Counting tiny socks…" },
  { emoji: "🐣", text: "Sitting on your answer" },
  { emoji: "🧸", text: "Teddy's holding your spot" },
  { emoji: "🥱", text: "Even the baby's yawning" },
  { emoji: "🌙", text: "Rocking the cradle…" },
  { emoji: "🎀", text: "Wrapped up, ribbon and all" },
  { emoji: "👀", text: "Peekaboo any second now" },
  { emoji: "🚼", text: "Nappy change while you wait" },
  { emoji: "🐻", text: "Bear with us…" },
  { emoji: "💤", text: "Dreaming of the answer" },
  { emoji: "🦆", text: "Getting our ducks in a row" },
  { emoji: "🎵", text: "Humming a lullaby" },
  { emoji: "🧁", text: "Saving you a cupcake" },
  { emoji: "👣", text: "Tiny steps to the reveal" },
  { emoji: "🛁", text: "Bath time, back in a sec" },
  { emoji: "🧩", text: "Last piece slotting in" },
  { emoji: "🤗", text: "Cuddling your answer" },
  { emoji: "🍪", text: "Sneaking a biscuit" },
];

const ROTATE_MS = 3400;

/**
 * A shuffled running order over every line.
 *
 * Drawing independently at random would happily show the same line twice in a
 * row, which reads as a glitch. Shuffling and walking the deck guarantees all
 * twenty appear before any repeats, and `avoidFirst` stops a reshuffle from
 * opening on the line that just finished.
 */
function shuffledOrder(length: number, avoidFirst?: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (avoidFirst !== undefined && order.length > 1 && order[0] === avoidFirst) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}

/** Little bubbles bouncing in sequence, like a typing indicator. */
function Bubbles({ still }: { still: boolean }) {
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block size-1.5 rounded-full bg-white/80"
          animate={still ? undefined : { y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={
            still
              ? undefined
              : {
                  duration: 0.9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }
          }
        />
      ))}
    </span>
  );
}

export function LockedInBadge() {
  const still = useReducedMotion() ?? false;
  const [deck, setDeck] = useState<{ order: number[]; pos: number }>({
    order: [],
    pos: 0,
  });

  // Shuffled in an effect rather than in the state initialiser: a random value
  // during render differs between server and client and trips hydration.
  useEffect(() => {
    setDeck({ order: shuffledOrder(LINES.length), pos: 0 });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDeck((d) => {
        if (d.order.length === 0) return d;
        const next = d.pos + 1;
        if (next < d.order.length) return { ...d, pos: next };
        // Deck exhausted — reshuffle for the next pass.
        return {
          order: shuffledOrder(LINES.length, d.order[d.order.length - 1]),
          pos: 0,
        };
      });
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  const index = deck.order[deck.pos] ?? 0;
  const line = LINES[index];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="flex items-center gap-2.5 rounded-full bg-white/20 py-2 pr-4 pl-3 shadow-sm"
      // The rotating text is decorative reassurance; announcing every swap
      // would interrupt a screen reader mid-question. The status is stated
      // once, politely.
      role="status"
      aria-label="Answer locked in. Waiting for the other players."
    >
      <motion.span
        aria-hidden
        className="text-xl leading-none"
        animate={still ? undefined : { y: [0, -3, 0], rotate: [0, -8, 8, 0] }}
        transition={
          still ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {line.emoji}
      </motion.span>

      {/* Fixed height so swapping lines of different lengths doesn't jog the
          pill up and down. */}
      <span aria-hidden className="flex h-5 items-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${deck.pos}-${index}`}
            initial={still ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={still ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="text-sm font-bold whitespace-nowrap text-white"
          >
            {line.text}
          </motion.span>
        </AnimatePresence>
      </span>

      <Bubbles still={still} />
    </motion.div>
  );
}
