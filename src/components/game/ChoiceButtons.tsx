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
 * The colours are decoration and nothing else — they are fixed to the slot,
 * not to the name, and the same name keeps whichever slot it was dealt. Only
 * the reveal colours carry meaning: green on the right answer, red on a wrong
 * pick, and those override the accent entirely.
 */
const ACCENTS = [
  {
    card: "from-rose-100 to-pink-200",
    chip: "from-pink-400 to-rose-500",
    edge: "ring-pink-300/70",
  },
  {
    card: "from-amber-100 to-orange-200",
    chip: "from-amber-400 to-orange-500",
    edge: "ring-amber-300/70",
  },
  {
    card: "from-sky-100 to-cyan-200",
    chip: "from-sky-400 to-cyan-500",
    edge: "ring-sky-300/70",
  },
  {
    card: "from-violet-100 to-purple-200",
    chip: "from-violet-400 to-purple-500",
    edge: "ring-violet-300/70",
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
              "group relative flex items-center gap-2.5 rounded-2xl bg-gradient-to-br p-2",
              "shadow-md ring-1 ring-inset transition-colors",
              "sm:gap-3 sm:p-2.5",
              accent.card,
              accent.edge,
              !isRevealed && !disabled && "hover:shadow-lg",
              isSelected && !isRevealed && "ring-2 ring-primary shadow-lg",
              isCorrectChoice && "from-emerald-50 to-green-100 ring-2 ring-emerald-500",
              isWrongSelected && "from-rose-50 to-red-100 ring-2 ring-red-500",
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
                "min-w-0 flex-1 text-left text-sm font-bold break-words text-foreground",
                "sm:text-lg",
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
