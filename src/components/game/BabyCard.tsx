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
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/5"
      initial={{ scale: 1 - stackIndex * 0.05, y: stackIndex * 14, opacity: stackIndex ? 0.7 : 1 }}
      animate={
        exitDirection
          ? {
              x: exitDirection === "correct" ? 420 : -420,
              rotate: exitDirection === "correct" ? 18 : -18,
              opacity: 0,
              transition: { duration: 0.45, ease: "easeIn" },
            }
          : {
              scale: 1 - stackIndex * 0.05,
              y: stackIndex * 14,
              opacity: stackIndex ? 0.7 : 1,
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
