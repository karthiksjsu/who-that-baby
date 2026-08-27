"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type BabyReactionVariant = "happy" | "crying";

/** Sparkles that pop around a correct answer. Coords are relative to (120, 120). */
const SPARKLES = [
  { x: -96, y: -54, size: 1.0, delay: 0 },
  { x: 98, y: -60, size: 0.78, delay: 0.16 },
  { x: -88, y: 56, size: 0.66, delay: 0.32 },
  { x: 100, y: 40, size: 0.88, delay: 0.46 },
  { x: 0, y: -100, size: 0.72, delay: 0.6 },
];

/** Teardrops, staggered per eye so they read as two steady streams. */
const TEARS = [
  { x: 80, delay: 0 },
  { x: 160, delay: 0.28 },
  { x: 80, delay: 0.58 },
  { x: 160, delay: 0.86 },
];

/** Sticker palette — flat fills plus a dark keyline, matching the trail baby. */
const OUTLINE = "#5A3320";
const SKIN_FLAT = "#FBCEA4";
const EAR = "#F0BE92";
const INK = "#3B1E1A";
const MOUTH = "#6B2231";
const TONGUE = "#FF7C97";
const BLUSH = "#FF7BA0";
const BOW = "#FF6F9C";
const BOW_DEEP = "#DB3F73";

const HAPPY_MOUTH = "M 88 148 Q 120 142 152 148 Q 152 188 120 188 Q 88 188 88 148 Z";

/**
 * A baby girl who reacts to a guess — giggling for a correct answer, bawling
 * for a wrong one.
 *
 * Drawn as a flat outlined sticker rather than a shaded illustration, to match
 * the baby on the progress trail. No eyebrows and no protruding ears: both
 * push the face toward looking adult. The bow sits up on the crown rather than
 * beside an ear, where it used to collide.
 *
 * Purely decorative — it never intercepts pointer events and is hidden from
 * screen readers, since `ScorePopup` already announces the outcome in text.
 * Remount it (via `key`) to replay the entrance on each new guess.
 */
export function BabyReaction({
  variant,
  className,
}: {
  variant: BabyReactionVariant;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (part: string) => `${part}-${uid}`;
  const still = useReducedMotion() ?? false;
  const happy = variant === "happy";

  // With reduced motion the face still fades in, but nothing loops.
  const loop = <T,>(props: T): T | undefined => (still ? undefined : props);

  return (
    <div
      aria-hidden
      className={
        "pointer-events-none absolute inset-0 z-30 flex items-center justify-center " +
        (className ?? "")
      }
    >
      <motion.svg
        viewBox="0 0 240 240"
        className="h-48 w-48 drop-shadow-[0_10px_28px_rgba(0,0,0,0.32)] sm:h-56 sm:w-56"
        initial={{ scale: 0.35, opacity: 0, rotate: happy ? -16 : 12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.75, opacity: 0 }}
        transition={
          still
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 420, damping: 13, mass: 0.7 }
        }
      >
        <defs>
          <radialGradient id={id("halo")} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={happy ? "#FFF3A8" : "#B7E4FF"}
              stopOpacity="0.5"
            />
            <stop
              offset="100%"
              stopColor={happy ? "#FFF3A8" : "#B7E4FF"}
              stopOpacity="0"
            />
          </radialGradient>
          <radialGradient id={id("tear")} cx="34%" cy="26%" r="74%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#A5DFFA" />
            <stop offset="100%" stopColor="#42AEE8" />
          </radialGradient>
          <linearGradient id={id("spark")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF6C8" />
            <stop offset="100%" stopColor="#FFC93F" />
          </linearGradient>
          <clipPath id={id("lips")}>
            {happy ? (
              <path d={HAPPY_MOUTH} />
            ) : (
              <ellipse cx="120" cy="160" rx="26" ry="26" />
            )}
          </clipPath>
        </defs>

        {/* Halo so the face reads against any photo underneath. */}
        <motion.circle
          cx="120"
          cy="120"
          r="118"
          fill={`url(#${id("halo")})`}
          animate={loop({ scale: [0.9, 1.06, 0.9] })}
          transition={loop({ duration: 1.9, repeat: Infinity, ease: "easeInOut" })}
          style={{ transformOrigin: "120px 120px" }}
        />

        {/* Happy: bounce with squash-and-stretch. Crying: shuddering wobble. */}
        <motion.g
          style={{ transformOrigin: "120px 190px" }}
          animate={loop(
            happy
              ? { y: [0, -11, 0], scaleY: [1, 1.05, 0.96], scaleX: [1, 0.97, 1.04] }
              : { rotate: [-5, 5, -5], y: [0, 3, 0] },
          )}
          transition={loop({
            duration: happy ? 0.8 : 0.45,
            repeat: Infinity,
            ease: "easeInOut",
          })}
        >
          {/* Silhouette. Everything in here shares the keyline; the features
              below sit outside it so they stay crisp instead of being ringed. */}
          <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
            <ellipse cx="46" cy="132" rx="11" ry="15" fill={EAR} />
            <ellipse cx="194" cy="132" rx="11" ry="15" fill={EAR} />
            <ellipse cx="120" cy="124" rx="82" ry="76" fill={SKIN_FLAT} />
          </g>

          {/* One defiant curl */}
          <path
            d="M 108 50 C 105 30 122 20 134 28 C 144 35 141 54 128 54"
            fill="none"
            stroke={OUTLINE}
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/*
            Bow, up on the crown and clear of the ear.

            Placement and animation MUST live on separate elements. Framer
            Motion writes its own `transform` when it animates rotate, which
            silently overwrites a static `transform` attribute on the same
            node — the bow then collapses to the origin at 1x scale and
            disappears off the top-left of the face. The outer <g> holds the
            placement; only the inner one is animated.
          */}
          <g transform="translate(172 54) scale(2.6)">
            <motion.g
              animate={loop(
                happy ? { rotate: [-20, -12, -20] } : { rotate: [-20, -27, -20] },
              )}
              initial={{ rotate: -20 }}
              transition={loop({
                duration: happy ? 0.8 : 0.45,
                repeat: Infinity,
                ease: "easeInOut",
              })}
            >
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
            </motion.g>
          </g>

          <ellipse cx="62" cy="152" rx="21" ry="12" fill={BLUSH} opacity="0.75" />
          <ellipse cx="178" cy="152" rx="21" ry="12" fill={BLUSH} opacity="0.75" />

          {happy ? (
            <>
              {/* Big glossy eyes, with an occasional blink */}
              <motion.g
                style={{ transformOrigin: "120px 118px" }}
                animate={loop({ scaleY: [1, 1, 0.1, 1, 1] })}
                transition={loop({
                  duration: 2.6,
                  times: [0, 0.84, 0.88, 0.93, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                })}
              >
                <ellipse cx="92" cy="118" rx="17" ry="20" fill={INK} />
                <ellipse cx="148" cy="118" rx="17" ry="20" fill={INK} />
                <circle cx="86" cy="110" r="7" fill="#FFFFFF" />
                <circle cx="142" cy="110" r="7" fill="#FFFFFF" />
                <circle cx="98" cy="126" r="3.4" fill="#FFFFFF" opacity="0.75" />
                <circle cx="154" cy="126" r="3.4" fill="#FFFFFF" opacity="0.75" />
              </motion.g>

              {/* Open giggle, with two proud teeth */}
              <motion.g
                style={{ transformOrigin: "120px 148px" }}
                animate={loop({ scaleY: [1, 0.76, 1] })}
                transition={loop({
                  duration: 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                })}
              >
                <path
                  d={HAPPY_MOUTH}
                  fill={MOUTH}
                  stroke={OUTLINE}
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <g clipPath={`url(#${id("lips")})`}>
                  <ellipse cx="120" cy="182" rx="19" ry="10" fill={TONGUE} />
                  <rect x="108" y="146" width="11" height="11" rx="3" fill="#FFF9F0" />
                  <rect x="122" y="146" width="11" height="11" rx="3" fill="#FFF9F0" />
                </g>
              </motion.g>
            </>
          ) : (
            <>
              {/* Eyes squeezed shut */}
              <path
                d="M 76 116 q 16 18 32 0"
                fill="none"
                stroke={INK}
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 132 116 q 16 18 32 0"
                fill="none"
                stroke={INK}
                strokeWidth="8"
                strokeLinecap="round"
              />

              {/* Full-throated wail */}
              <motion.g
                style={{ transformOrigin: "120px 142px" }}
                animate={loop({ scaleY: [1, 1.18, 1], scaleX: [1, 0.92, 1] })}
                transition={loop({
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                })}
              >
                <ellipse
                  cx="120"
                  cy="160"
                  rx="26"
                  ry="26"
                  fill={MOUTH}
                  stroke={OUTLINE}
                  strokeWidth="4"
                />
                <g clipPath={`url(#${id("lips")})`}>
                  <ellipse cx="120" cy="180" rx="14" ry="9" fill={TONGUE} />
                </g>
              </motion.g>
            </>
          )}
        </motion.g>

        {/* Shudder lines flanking the wail */}
        {!happy && (
          <motion.g
            stroke="#8FD3F4"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            animate={loop({ opacity: [0.25, 0.8, 0.25], scale: [0.94, 1.06, 0.94] })}
            transition={loop({ duration: 0.55, repeat: Infinity, ease: "easeInOut" })}
            style={{ transformOrigin: "120px 130px" }}
          >
            <path d="M 16 106 q -8 26 0 52" />
            <path d="M 224 106 q 8 26 0 52" />
          </motion.g>
        )}

        {happy
          ? SPARKLES.map((s, i) => (
              <g
                key={i}
                transform={`translate(${120 + s.x} ${120 + s.y}) scale(${s.size})`}
              >
                <motion.path
                  d="M 0 -13 Q 3 -3 13 0 Q 3 3 0 13 Q -3 3 -13 0 Q -3 -3 0 -13 Z"
                  fill={`url(#${id("spark")})`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={
                    still
                      ? { scale: 1, opacity: 1 }
                      : { scale: [0, 1.2, 0], opacity: [0, 1, 0], rotate: [0, 110] }
                  }
                  transition={
                    still
                      ? { duration: 0.2 }
                      : {
                          duration: 1.05,
                          delay: s.delay,
                          repeat: Infinity,
                          repeatDelay: 0.3,
                          ease: "easeOut",
                        }
                  }
                />
              </g>
            ))
          : TEARS.map((t, i) => (
              // Start at the outer eye corner so they run down the cheek
              // rather than appearing to float over it.
              <g key={i} transform={`translate(${t.x} 136)`}>
                <motion.g
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={
                    still
                      ? { y: 12, opacity: 1, scale: 1 }
                      : {
                          y: [0, 58],
                          opacity: [0, 1, 1, 0],
                          scale: [0.5, 1, 1, 0.8],
                        }
                  }
                  transition={
                    still
                      ? { duration: 0.2 }
                      : {
                          duration: 1.2,
                          delay: t.delay,
                          repeat: Infinity,
                          ease: "easeIn",
                        }
                  }
                >
                  <path
                    d="M 0 0 C 5 8 9 13 9 17 A 9 9 0 0 1 -9 17 C -9 13 -5 8 0 0 Z"
                    fill={`url(#${id("tear")})`}
                  />
                  <ellipse
                    cx="-3"
                    cy="16"
                    rx="2.6"
                    ry="3.6"
                    fill="#FFFFFF"
                    opacity="0.8"
                  />
                </motion.g>
              </g>
            ))}
      </motion.svg>
    </div>
  );
}
