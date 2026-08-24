"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BonusRoundIntro } from "@/components/game/BonusRoundIntro";
import { CardStack } from "@/components/game/CardStack";
import { GameComplete } from "@/components/game/GameComplete";

type Stage = "choice" | "bonus-intro" | "bonus" | "complete";

export function PlayFlow({ token }: { token: string }) {
  const [stage, setStage] = useState<Stage>("choice");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="flex w-full flex-col items-center"
      >
        {stage === "choice" && (
          <CardStack token={token} round="choice" onFinished={() => setStage("bonus-intro")} />
        )}
        {stage === "bonus-intro" && (
          <BonusRoundIntro onStart={() => setStage("bonus")} />
        )}
        {stage === "bonus" && (
          <CardStack token={token} round="bonus" onFinished={() => setStage("complete")} />
        )}
        {stage === "complete" && <GameComplete />}
      </motion.div>
    </AnimatePresence>
  );
}
