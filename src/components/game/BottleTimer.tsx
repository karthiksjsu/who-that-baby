"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { QUESTION_TIME_MS, TIMER_DANGER_FRACTION } from "@/lib/game/constants";
import { cn } from "@/lib/utils";

/** Milk surface at a full bottle, and at an empty one. */
const MILK_TOP = 38;
const MILK_BOTTOM = 139;
const MILK_HEIGHT = MILK_BOTTOM - MILK_TOP;

/** Inner wall of the bottle — the milk is clipped to this. */
const BOTTLE_INNER =
  "M 15 49 Q 15 38 26 35.5 L 38 35.5 Q 49 38 49 49 L 49 131 Q 49 139 41 139 L 23 139 Q 15 139 15 131 Z";
const BOTTLE_OUTER =
  "M 12 48 Q 12 36 24 33 L 40 33 Q 52 36 52 48 L 52 132 Q 52 142 42 142 L 22 142 Q 12 142 12 132 Z";

/**
 * A baby bottle that drains as the clock runs down, used as the per-question
 * timer.
 *
 * The milk level is driven by a single linear framer-motion animation on a
 * motion value rather than per-frame React state — a 30 second countdown at
 * 60fps would otherwise re-render the whole card stack ~1800 times. Only the
 * seconds readout and the danger flag touch React state.
 *
 * Remount it (via `key`) when the card changes; set `running` to false to
 * freeze the level where it is during the reveal.
 */
export function BottleTimer({
  deadlineAt,
  durationMs = QUESTION_TIME_MS,
  running,
  onExpire,
  className,
}: {
  /**
   * Local-clock instant the phase ends. Passed as a deadline rather than a
   * start time because the server owns the clock: the caller has already
   * corrected the server's deadline for this device's skew, and re-deriving it
   * from a local start would reintroduce the drift.
   */
  deadlineAt: number;
  durationMs?: number;
  running: boolean;
  onExpire?: () => void;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (part: string) => `${part}-${uid}`;
  const still = useReducedMotion() ?? false;

  const level = useMotionValue(1);
  const [danger, setDanger] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil(durationMs / 1000));

  // Keep the latest callback without making it an effect dependency, so a new
  // parent render can't restart the countdown mid-card.
  const onExpireRef = useRef(onExpire);
  // Declared before the countdown effect so it is always up to date by the
  // time the expiry timer below could fire.
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const deadline = deadlineAt;
    const remaining = Math.max(0, deadline - Date.now());

    // Sync to real elapsed time first, so a freeze/resume lands in the right place.
    level.set(durationMs > 0 ? remaining / durationMs : 0);
    setSecondsLeft(Math.ceil(remaining / 1000));
    if (!running) return;

    const tick = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setSecondsLeft(Math.ceil(left / 1000));
      // Reduced motion gets a coarse stepped drain instead of a smooth one.
      if (still) level.set(durationMs > 0 ? left / durationMs : 0);
    }, 200);
    const expiry = setTimeout(() => onExpireRef.current?.(), remaining);
    const controls = still
      ? null
      : animate(level, 0, { duration: remaining / 1000, ease: "linear" });

    return () => {
      clearInterval(tick);
      clearTimeout(expiry);
      controls?.stop();
    };
  }, [deadlineAt, durationMs, running, still, level]);

  // Fires every frame, but setState bails out when the boolean hasn't flipped.
  useMotionValueEvent(level, "change", (value) => {
    const next = value <= TIMER_DANGER_FRACTION;
    setDanger((prev) => (prev === next ? prev : next));
  });

  const milkY = useTransform(level, (v) => MILK_BOTTOM - v * MILK_HEIGHT);
  const milkH = useTransform(level, (v) => v * MILK_HEIGHT);
  const milkFill = useTransform(
    level,
    [0, TIMER_DANGER_FRACTION, TIMER_DANGER_FRACTION + 0.06, 1],
    ["#FF7A6B", "#FFA98F", "#FFF3DA", "#FFF3DA"],
  );

  return (
    <div
      role="timer"
      aria-label={`${secondsLeft} seconds left to answer`}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-1 transition-colors",
        "sm:gap-2 sm:py-1 sm:pr-3 sm:pl-1.5",
        danger ? "bg-red-500/85" : "bg-white/20",
        className,
      )}
    >
      <motion.svg
        viewBox="0 0 64 150"
        className="h-10 w-auto sm:h-12"
        animate={danger && !still ? { rotate: [-6, 6, -6] } : { rotate: 0 }}
        transition={
          danger && !still
            ? { duration: 0.22, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        style={{ transformOrigin: "32px 130px" }}
      >
        <defs>
          <clipPath id={id("inner")}>
            <path d={BOTTLE_INNER} />
          </clipPath>
          <linearGradient id={id("collar")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFA9C6" />
            <stop offset="45%" stopColor="#FF7FA8" />
            <stop offset="100%" stopColor="#E85C8A" />
          </linearGradient>
          <linearGradient id={id("teat")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFE2CC" />
            <stop offset="100%" stopColor="#F0BC98" />
          </linearGradient>
        </defs>

        {/* Teat and collar */}
        <path
          d="M 32 3 C 39 3 42 9 41 17 L 23 17 C 22 9 25 3 32 3 Z"
          fill={`url(#${id("teat")})`}
        />
        <rect x="24" y="15" width="16" height="5" rx="2.5" fill="#E3A87F" />
        <rect x="18" y="19" width="28" height="14" rx="5" fill={`url(#${id("collar")})`} />
        <rect x="21" y="22" width="9" height="3" rx="1.5" fill="#FFFFFF" opacity="0.45" />

        {/* Glass */}
        <path d={BOTTLE_OUTER} fill="#FFFFFF" opacity="0.28" />

        {/* Milk */}
        <g clipPath={`url(#${id("inner")})`}>
          <motion.rect x="13" width="38" y={milkY} height={milkH} fill={milkFill} />
          <motion.ellipse
            cx="32"
            cy={milkY}
            rx="19"
            ry="2.6"
            fill="#FFFFFF"
            opacity="0.7"
            animate={still ? undefined : { scaleX: [1, 0.93, 1], scaleY: [1, 1.35, 1] }}
            transition={
              still
                ? undefined
                : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
            }
            style={{ transformOrigin: "32px 0px" }}
          />
        </g>

        {/* Measurement ticks */}
        <g stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
          <path d="M 41 62 L 47 62" />
          <path d="M 43 82 L 47 82" />
          <path d="M 41 102 L 47 102" />
          <path d="M 43 122 L 47 122" />
        </g>

        {/* Glass outline and specular streak */}
        <path
          d={BOTTLE_OUTER}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          opacity="0.65"
        />
        <path
          d="M 20 54 Q 18 92 21 126"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.55"
        />
      </motion.svg>

      <span className="font-display text-lg font-bold tabular-nums text-white sm:text-xl">
        {secondsLeft}s
      </span>
    </div>
  );
}
