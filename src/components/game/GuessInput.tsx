"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GuessInputProps {
  cardId: string;
  disabled: boolean;
  isCorrect: boolean | null;
  correctName: string | null;
  onSubmit: (guess: string) => void;
}

export function GuessInput({ cardId, disabled, isCorrect, correctName, onSubmit }: GuessInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue("");
    inputRef.current?.focus();
  }, [cardId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  }

  const revealed = correctName !== null;

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <motion.div
        animate={
          revealed
            ? { x: [0, isCorrect ? 0 : -6, isCorrect ? 0 : 6, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.3 }}
      >
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Who is this baby?"
          autoComplete="off"
          className={cn(
            "h-14 bg-white text-lg shadow-sm",
            revealed && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
            revealed && !isCorrect && "border-red-500 bg-red-50 text-red-700"
          )}
        />
      </motion.div>

      {revealed && !isCorrect && (
        <p className="text-sm text-muted-foreground">
          Correct answer: <span className="font-semibold text-foreground">{correctName}</span>
        </p>
      )}

      <Button
        type="submit"
        disabled={disabled || !value.trim()}
        size="lg"
        className="h-14 w-full text-lg font-semibold"
      >
        Guess
      </Button>
    </form>
  );
}
