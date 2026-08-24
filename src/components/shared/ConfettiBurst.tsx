"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiBurst() {
  useEffect(() => {
    const colors = ["#ec4899", "#a855f7", "#f97316", "#22d3ee"];
    const end = Date.now() + 2500;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 }, colors });
  }, []);

  return null;
}
