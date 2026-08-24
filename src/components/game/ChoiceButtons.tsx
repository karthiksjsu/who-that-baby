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

export function ChoiceButtons({
  choices,
  selected,
  correctName,
  disabled,
  onChoose,
}: ChoiceButtonsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {choices.map((name) => {
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
              "rounded-2xl border-2 px-4 py-3.5 text-left text-base font-semibold shadow-sm transition-colors",
              "border-border bg-white text-foreground",
              !isRevealed && !disabled && "hover:border-primary hover:bg-primary/5 hover:shadow-md",
              isSelected && !isRevealed && "border-primary bg-primary/10",
              isCorrectChoice && "border-emerald-500 bg-emerald-50 text-emerald-700",
              isWrongSelected && "border-red-500 bg-red-50 text-red-700",
              disabled && !isCorrectChoice && !isWrongSelected && "opacity-60"
            )}
          >
            {name}
          </motion.button>
        );
      })}
    </div>
  );
}
