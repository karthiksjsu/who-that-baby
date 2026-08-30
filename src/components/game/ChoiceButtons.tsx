"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChoiceButtonsProps {
  choices: string[];
  selected: string | null;
  correctName: string | null;
  disabled: boolean;
  onChoose: (name: string) => void;
}

/**
 * One accent per slot, so the answers read as a set of cards rather than a
 * stack of white boxes.
 *
 * The card hues are lifted off --party-gradient in globals.css — 340, 315,
 * 290 and 265 are four evenly spaced steps along the same arc the background
 * sweeps through, so the answers sit in the page rather than on top of it.
 * They are held at high lightness and low chroma (0.95 / 0.05) because the
 * gradient behind them is fully saturated; anything stronger competes with it.
 *
 * The chips stay on the original Tailwind palette. They are the one part of a
 * card that has a job beyond decoration — across a noisy room a guest finds
 * their answer by the colour of the circle before they read the letter — so
 * they are deliberately more saturated and more distinct from each other than
 * the card hues are.
 *
 * All of it is still decoration in the sense that matters: the colours are
 * fixed to the slot, not to the name, and the same name keeps whichever slot
 * it was dealt. Only the reveal colours carry meaning — green on the right
 * answer, red on a wrong pick — and those override the accent entirely.
 */
const ACCENTS = [
  {
    card: "bg-[oklch(0.95_0.05_340)]",
    ink: "text-[oklch(0.31_0.09_340)]",
    edge: "ring-[oklch(0.87_0.08_340)]",
    chip: "from-pink-400 to-rose-500",
  },
  {
    card: "bg-[oklch(0.95_0.05_315)]",
    ink: "text-[oklch(0.31_0.09_315)]",
    edge: "ring-[oklch(0.87_0.08_315)]",
    chip: "from-amber-400 to-orange-500",
  },
  {
    card: "bg-[oklch(0.95_0.05_290)]",
    ink: "text-[oklch(0.31_0.09_290)]",
    edge: "ring-[oklch(0.87_0.08_290)]",
    chip: "from-sky-400 to-cyan-500",
  },
  {
    card: "bg-[oklch(0.95_0.05_265)]",
    ink: "text-[oklch(0.31_0.09_265)]",
    edge: "ring-[oklch(0.87_0.08_265)]",
    chip: "from-violet-400 to-purple-500",
  },
];

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function ChoiceButtons({
  choices,
  selected,
  correctName,
  disabled,
  onChoose,
}: ChoiceButtonsProps) {
  return (
    /*
     * Two columns at every width. One column costs about a hundred vertical
     * pixels more on a phone, and that height is worth more to the photo —
     * which is the question being asked — than to four cards that read fine
     * side by side.
     */
    <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:gap-3">
      {choices.map((name, i) => {
        const accent = ACCENTS[i % ACCENTS.length];
        const isSelected = selected === name;
        const isRevealed = correctName !== null;
        const isCorrectChoice = isRevealed && name === correctName;
        const isWrongSelected = isRevealed && isSelected && name !== correctName;

        return (
          <motion.button
            key={name}
            type="button"
            disabled={disabled}
            onClick={() => onChoose(name)}
            whileTap={{ scale: 0.96 }}
            whileHover={!isRevealed && !disabled ? { scale: 1.02 } : undefined}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-2xl p-2",
              "shadow-md ring-1 ring-inset transition-colors",
              "sm:gap-3 sm:p-2.5",
              accent.card,
              accent.edge,
              !isRevealed && !disabled && "hover:shadow-lg",
              isSelected && !isRevealed && "ring-2 ring-primary shadow-lg",
              isCorrectChoice && "bg-emerald-100 ring-2 ring-emerald-500",
              isWrongSelected && "bg-red-100 ring-2 ring-red-500",
              disabled && !isCorrectChoice && !isWrongSelected && "opacity-60"
            )}
          >
            {/* Slot marker: the letter while the question is live, the verdict
                once it is over. */}
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                "font-display text-sm font-extrabold text-white shadow-sm",
                "sm:size-9 sm:text-base",
                accent.chip,
                isCorrectChoice && "from-emerald-400 to-green-600",
                isWrongSelected && "from-rose-400 to-red-600"
              )}
              aria-hidden
            >
              {isCorrectChoice ? "✓" : isWrongSelected ? "✕" : LETTERS[i] ?? "•"}
            </span>

            <span
              className={cn(
                "min-w-0 flex-1 text-left text-sm font-bold break-words",
                "sm:text-lg",
                accent.ink,
                isCorrectChoice && "text-emerald-800",
                isWrongSelected && "text-red-800"
              )}
            >
              {name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
