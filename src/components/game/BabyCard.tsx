"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { GameCard } from "@/types/db";

interface BabyCardProps {
  card: GameCard;
  stackIndex: number;
  isTop: boolean;
  exitDirection: "correct" | "wrong" | null;
}

export function BabyCard({ card, stackIndex, isTop, exitDirection }: BabyCardProps) {
  const restRotate = stackIndex === 0 ? 0 : stackIndex === 1 ? 3 : -4;

  return (
    <motion.div
      className="shadow-party absolute inset-0 overflow-hidden rounded-[2rem] bg-white ring-4 ring-white"
      initial={{
        scale: 1 - stackIndex * 0.06,
        y: stackIndex * 16,
        rotate: restRotate,
        opacity: stackIndex ? 0.75 : 1,
      }}
      animate={
        exitDirection
          ? {
              x: exitDirection === "correct" ? 420 : -420,
              rotate: exitDirection === "correct" ? 24 : -24,
              opacity: 0,
              transition: { duration: 0.45, ease: "easeIn" },
            }
          : {
              scale: 1 - stackIndex * 0.06,
              y: stackIndex * 16,
              rotate: restRotate,
              opacity: stackIndex ? 0.75 : 1,
              transition: { type: "spring", stiffness: 260, damping: 24 },
            }
      }
      style={{ zIndex: 10 - stackIndex }}
    >
      <Image
        src={card.photo_url}
        alt="Guess who this baby is!"
        fill
        sizes="(max-width: 480px) 90vw, 420px"
        className="object-cover"
        priority={isTop}
      />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
    </motion.div>
  );
}
