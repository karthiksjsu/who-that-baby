"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { GameRound } from "@/types/db";

/** Past this many cards the prints crowd together, so we drop them. */
const MAX_PRINTS = 14;

const ONESIE = "#FFA9C6";
const INK = "#3B1E1A";
const BOW = "#FF6F9C";
const BOW_DEEP = "#DB3F73";

/** Sticker palette: flat fills plus a dark keyline, for legibility at 48px. */
const OUTLINE = "#5A3320";
const SKIN_FLAT = "#FBCEA4";
const SKIN_FAR = "#E8AC7B";

/** Two steps per cycle, at a toddler's pace. */
const STEP_TIMES = [0, 0.25, 0.5, 0.75, 1];
const STEP_DURATION = 0.9;

/**
 * Four beats per crawl cycle, one limb each. Every beat gets a midpoint so a
 * limb can lift and land inside its own quarter and stay put through the rest.
 */
const CRAWL_TIMES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];


/** A single baby footprint: chubby sole plus five toe beans. */
function Footprint({ filled, flip }: { filled: boolean; flip: boolean }) {
  return (
    <svg
      viewBox="0 0 20 28"
      className="h-3.5 w-auto sm:h-4"
      style={{ transform: `scaleX(${flip ? -1 : 1}) rotate(${flip ? 8 : -8}deg)` }}
      aria-hidden
    >
      <g fill="#FFFFFF" opacity={filled ? 0.95 : 0.32}>
        <path d="M 10 26 C 4 26 2 21 3 16 C 4 11 7 9 10 9 C 13 9 16 11 17 16 C 18 21 16 26 10 26 Z" />
        <ellipse cx="5" cy="6" rx="2.2" ry="2.8" />
        <ellipse cx="9.4" cy="3.4" rx="2" ry="2.6" />
        <ellipse cx="13.4" cy="3.6" rx="1.8" ry="2.3" />
        <ellipse cx="16.6" cy="6" rx="1.6" ry="2" />
        <ellipse cx="18.6" cy="9.4" rx="1.3" ry="1.7" />
      </g>
    </svg>
  );
}

/**
 * Crawl-round baby: bold sticker style, side profile, facing the way she goes.
 *
 * Drawn flat and outlined rather than shaded. She renders about 48px tall on
 * the trail, where gradients and 1px highlights turn to mush — a dark outline
 * and solid fills are what actually survive at that size and separate her from
 * the purple backdrop.
 *
 * Gait is a four-beat lateral sequence, the pattern a cat uses at a walk and
 * the one babies use: far leg, far arm, near leg, near arm, with exactly one
 * limb off the ground at a time. Two limbs on the same beat reads as a hop.
 */
function CrawlingBaby({ still }: { still: boolean }) {
  const cycle = still
    ? undefined
    : {
        duration: 1.15,
        times: CRAWL_TIMES,
        repeat: Infinity,
        ease: "easeInOut" as const,
      };

  /** Lifts and reaches on its own quarter of the cycle, planted the rest. */
  const step = (beat: 0 | 1 | 2 | 3, lift: number) => {
    if (still) return undefined;
    const y = Array<number>(CRAWL_TIMES.length).fill(0);
    const x = Array<number>(CRAWL_TIMES.length).fill(0);
    const peak = beat * 2 + 1;
    y[peak] = -lift;
    x[peak] = 5;
    return { y, x };
  };

  return (
    <motion.svg
      viewBox="0 0 100 78"
      className="h-10 w-auto drop-shadow-[0_3px_7px_rgba(0,0,0,0.32)] sm:h-12"
      aria-hidden
    >
      {/* One small dip per beat — four per cycle, not one. */}
      <motion.g
        animate={
          still ? undefined : { y: [0, -1.5, 0, -1.5, 0, -1.5, 0, -1.5, 0] }
        }
        transition={cycle}
        style={{ transformOrigin: "50px 70px" }}
      >
        {/* Everything in here inherits the outline. Facial features sit
            outside it, so they stay crisp instead of being ringed too. */}
        <g stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round">
          {/* Beat 2 — far arm */}
          <motion.g animate={step(1, 5)} transition={cycle}>
            <rect x="58" y="48" width="13" height="18" rx="6.5" fill={SKIN_FAR} />
          </motion.g>
          {/* Beat 1 — far leg */}
          <motion.g animate={step(0, 5)} transition={cycle}>
            <rect x="24" y="47" width="15" height="18" rx="7.5" fill={SKIN_FAR} />
          </motion.g>

          <ellipse cx="34" cy="49" rx="24" ry="17" fill={ONESIE} />

          {/* Beat 3 — near leg */}
          <motion.g animate={step(2, 7)} transition={cycle}>
            <rect x="14" y="49" width="18" height="21" rx="9" fill={SKIN_FLAT} />
          </motion.g>
          {/* Beat 4 — near arm */}
          <motion.g animate={step(3, 7)} transition={cycle}>
            <rect x="50" y="49" width="15" height="21" rx="7.5" fill={SKIN_FLAT} />
          </motion.g>

          <circle cx="66" cy="30" r="25" fill={SKIN_FLAT} />
        </g>

        {/* Head, tilting gently with the beat */}
        <motion.g
          animate={
            still ? undefined : { rotate: [0, 1.5, 0, -1.5, 0, 1.5, 0, -1.5, 0] }
          }
          transition={cycle}
          style={{ transformOrigin: "60px 45px" }}
        >
          <path
            d="M 60 8 C 58 -1 66 -5 71 -1 C 75 2 74 10 69 10"
            fill="none"
            stroke={OUTLINE}
            strokeWidth="5"
            strokeLinecap="round"
          />

          <g transform="translate(46 20) rotate(16)">
            <path
              d="M 0 0 C -13 -12 -19 -2 -15 6 C -12 12 -3 6 0 0 Z"
              fill={BOW}
              stroke={OUTLINE}
              strokeWidth="2.5"
            />
            <path
              d="M 0 0 C 13 -12 19 -2 15 6 C 12 12 3 6 0 0 Z"
              fill={BOW}
              stroke={OUTLINE}
              strokeWidth="2.5"
            />
            <circle r="4.5" fill={BOW_DEEP} />
          </g>

          <ellipse cx="72" cy="42" rx="8.5" ry="5" fill="#FF7BA0" opacity="0.7" />
          <ellipse cx="76" cy="30" rx="5.5" ry="7.5" fill={INK} />
          <circle cx="74" cy="26.5" r="2.6" fill="#FFFFFF" />
          <path
            d="M 74 43 Q 78 48 82 43"
            fill="none"
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}

/**
 * Walk-round baby: same sticker treatment as the crawler, seen head-on.
 *
 * The walk is sold by weight, not by swinging limbs: each foot lifts and
 * plants in turn, the body sways toward whichever foot carries the load, and
 * it rises highest at mid-stance. That vertical bob runs at twice the leg
 * frequency, which is what makes a cycle read as walking.
 */
function WalkingBaby({ still }: { still: boolean }) {
  const cycle = still
    ? undefined
    : {
        duration: STEP_DURATION,
        times: STEP_TIMES,
        repeat: Infinity,
        ease: "easeInOut" as const,
      };

  /** `phase` 1 lifts on the first step, 0 lifts on the second. */
  const leg = (phase: 0 | 1, out: number) =>
    still
      ? undefined
      : {
          y: phase ? [0, -6, 0, 0, 0] : [0, 0, 0, -6, 0],
          rotate: phase ? [0, out, 0, 0, 0] : [0, 0, 0, -out, 0],
        };

  return (
    <motion.svg
      viewBox="0 0 64 78"
      className="h-10 w-auto drop-shadow-[0_3px_7px_rgba(0,0,0,0.32)] sm:h-12"
      aria-hidden
    >
      <motion.g
        animate={
          still
            ? undefined
            : {
                x: [0, -2.5, 0, 2.5, 0],
                y: [0, -2.5, 0, -2.5, 0],
                rotate: [0, -3, 0, 3, 0],
              }
        }
        transition={cycle}
        style={{ transformOrigin: "32px 70px" }}
      >
        <g stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round">
          {/* Legs */}
          <motion.g
            animate={leg(0, 9)}
            transition={cycle}
            style={{ transformOrigin: "25px 54px" }}
          >
            <rect x="19" y="52" width="12" height="16" rx="6" fill={SKIN_FLAT} />
            <ellipse cx="25" cy="70" rx="7" ry="4.2" fill="#FFF6EA" />
          </motion.g>
          <motion.g
            animate={leg(1, -9)}
            transition={cycle}
            style={{ transformOrigin: "39px 54px" }}
          >
            <rect x="33" y="52" width="12" height="16" rx="6" fill={SKIN_FLAT} />
            <ellipse cx="39" cy="70" rx="7" ry="4.2" fill="#FFF6EA" />
          </motion.g>

          {/* Arms up for balance, countering the sway */}
          <motion.rect
            x="8"
            y="42"
            width="11"
            height="16"
            rx="5.5"
            fill={SKIN_FLAT}
            animate={still ? undefined : { rotate: [-34, -24, -34, -44, -34] }}
            transition={cycle}
            style={{ transformOrigin: "13.5px 44px" }}
          />
          <motion.rect
            x="45"
            y="42"
            width="11"
            height="16"
            rx="5.5"
            fill={SKIN_FLAT}
            animate={still ? undefined : { rotate: [34, 44, 34, 24, 34] }}
            transition={cycle}
            style={{ transformOrigin: "50.5px 44px" }}
          />

          {/* Torso, kept small so the head dominates */}
          <ellipse cx="32" cy="50" rx="15" ry="12" fill={ONESIE} />

          {/* Head */}
          <ellipse cx="12" cy="26" rx="5" ry="6.5" fill={SKIN_FAR} />
          <ellipse cx="52" cy="26" rx="5" ry="6.5" fill={SKIN_FAR} />
          <circle cx="32" cy="24" r="21" fill={SKIN_FLAT} />
        </g>

        {/* Nappy, over the keyline so it reads as a separate layer */}
        <path
          d="M 20 51 Q 32 47 44 51 Q 43 61 32 61 Q 21 61 20 51 Z"
          fill="#FFFFFF"
          stroke={OUTLINE}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Features sit outside the keyline group so they stay crisp */}
        <path
          d="M 29 6 C 28 -1 33 -4 37 -1 C 40 2 39 7 35 7"
          fill="none"
          stroke={OUTLINE}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <g transform="translate(48 10) rotate(-20)">
          <path
            d="M 0 0 C -8 -7 -12 -1 -9.5 4 C -7.5 7.5 -2 3.5 0 0 Z"
            fill={BOW}
            stroke={OUTLINE}
            strokeWidth="1.8"
          />
          <path
            d="M 0 0 C 8 -7 12 -1 9.5 4 C 7.5 7.5 2 3.5 0 0 Z"
            fill={BOW}
            stroke={OUTLINE}
            strokeWidth="1.8"
          />
          <circle r="2.6" fill={BOW_DEEP} />
        </g>
        <ellipse cx="20" cy="32" rx="6" ry="3.6" fill="#FF7BA0" opacity="0.75" />
        <ellipse cx="44" cy="32" rx="6" ry="3.6" fill="#FF7BA0" opacity="0.75" />
        <ellipse cx="24" cy="24" rx="4.4" ry="5.4" fill={INK} />
        <ellipse cx="40" cy="24" rx="4.4" ry="5.4" fill={INK} />
        <circle cx="22.4" cy="21.8" r="1.9" fill="#FFFFFF" />
        <circle cx="38.4" cy="21.8" r="1.9" fill="#FFFFFF" />
        <path
          d="M 28 33 Q 32 37.5 36 33"
          fill="none"
          stroke={OUTLINE}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </motion.g>
    </motion.svg>
  );
}

export function ProgressBar({
  answered,
  total,
  round,
}: {
  answered: number;
  total: number;
  round: GameRound;
}) {
  const still = useReducedMotion() ?? false;
  const pct = total > 0 ? (answered / total) * 100 : 0;
  const showPrints = total > 0 && total <= MAX_PRINTS;
  const walking = round === "bonus";

  return (
    <div className="flex w-full shrink-0 flex-col gap-1">
      <div className="flex items-center justify-between text-xs font-bold text-white/90">
        <span>
          Baby {Math.min(answered + 1, total)} of {total}
        </span>
        <span>
          {Math.round(pct)}% {walking ? "walked" : "crawled"}
        </span>
      </div>

      <div className="relative h-10 w-full sm:h-12">
        {/* The trail itself */}
        <div className="absolute inset-x-0 bottom-0 h-3 rounded-full bg-white/25" />
        <motion.div
          className="absolute bottom-0 left-0 h-3 rounded-full bg-white/60"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={
            still ? { duration: 0.2 } : { type: "spring", stiffness: 200, damping: 30 }
          }
        />

        {/* One print per card, centred in its own slice of the trail */}
        {showPrints &&
          Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className="absolute bottom-4 -translate-x-1/2"
              style={{ left: `${((i + 0.5) / total) * 100}%` }}
            >
              <Footprint filled={i < answered} flip={i % 2 === 1} />
            </div>
          ))}

        {/* The baby, parked at the head of the trail */}
        <motion.div
          className="absolute bottom-1 -translate-x-1/2"
          initial={{ left: "0%" }}
          animate={{ left: `${Math.min(pct, 97)}%` }}
          transition={
            still ? { duration: 0.2 } : { type: "spring", stiffness: 180, damping: 22 }
          }
        >
          {walking ? <WalkingBaby still={still} /> : <CrawlingBaby still={still} />}
        </motion.div>
      </div>
    </div>
  );
}
