"use client";

import { useId } from "react";

/**
 * Nursery objects that Unicode has no emoji for.
 *
 * There is no pacifier and no rattle in the emoji set — 🪀 is a yo-yo, and the
 * nearest baby-adjacent glyphs (🍼 👶 🧸) are already used in the backdrop.
 *
 * Drawn to sit beside real emoji rather than beside the babies on the progress
 * trail: rounded volumes built from gradients, a bright specular highlight on
 * each form, and no keyline. The flat-plus-dark-outline sticker treatment used
 * for the trail babies looks pasted-on next to glossy system emoji.
 *
 * Gradient ids are per-instance via `useId`, so rendering two of the same icon
 * on one page can't collide.
 */

export function PacifierIcon({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (p: string) => `${p}-${uid}`;

  return (
    <svg viewBox="0 0 76 96" className={className} aria-hidden>
      <defs>
        <linearGradient id={id("ring")} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#FFA6C4" />
          <stop offset="45%" stopColor="#FF6F9C" />
          <stop offset="100%" stopColor="#D93B72" />
        </linearGradient>
        <radialGradient id={id("shield")} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#FFF1D8" />
          <stop offset="100%" stopColor="#E8C79A" />
        </radialGradient>
        <radialGradient id={id("teat")} cx="34%" cy="24%" r="80%">
          <stop offset="0%" stopColor="#FFE7CD" />
          <stop offset="55%" stopColor="#FFD2A2" />
          <stop offset="100%" stopColor="#D9A06A" />
        </radialGradient>
        <clipPath id={id("shieldClip")}>
          <ellipse cx="38" cy="48" rx="30" ry="17" />
        </clipPath>
      </defs>

      {/* Teat first, so the shield overlaps its base */}
      <path
        d="M 31 60 C 31 66 26 68 26 76 C 26 85 31 90 38 90 C 45 90 50 85 50 76 C 50 68 45 66 45 60 Z"
        fill={`url(#${id("teat")})`}
      />
      <ellipse
        cx="32"
        cy="78"
        rx="4"
        ry="6"
        fill="#FFFFFF"
        opacity="0.5"
        transform="rotate(-16 32 78)"
      />

      {/* Ring handle */}
      <path
        d="M 38 2 A 13 13 0 1 1 37.99 2 Z M 38 8.5 A 6.5 6.5 0 1 0 38.01 8.5 Z"
        fillRule="evenodd"
        fill={`url(#${id("ring")})`}
      />
      <path
        d="M 28 8 A 13 13 0 0 1 46 5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Stem */}
      <rect x="32" y="24" width="12" height="13" rx="4" fill={`url(#${id("ring")})`} />

      {/* Shield */}
      <ellipse cx="38" cy="48" rx="30" ry="17" fill={`url(#${id("shield")})`} />
      <g clipPath={`url(#${id("shieldClip")})`}>
        <ellipse cx="38" cy="70" rx="30" ry="14" fill="#C79A66" opacity="0.35" />
      </g>
      <ellipse
        cx="27"
        cy="41"
        rx="11"
        ry="5"
        fill="#FFFFFF"
        opacity="0.8"
        transform="rotate(-12 27 41)"
      />

      {/* Vent holes */}
      <circle cx="19" cy="49" r="3.6" fill="#D9B384" />
      <circle cx="57" cy="49" r="3.6" fill="#D9B384" />
      <circle cx="18.2" cy="48" r="1.3" fill="#FFFFFF" opacity="0.55" />
      <circle cx="56.2" cy="48" r="1.3" fill="#FFFFFF" opacity="0.55" />
    </svg>
  );
}

export function RattleIcon({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (p: string) => `${p}-${uid}`;

  return (
    <svg viewBox="0 0 88 90" className={className} aria-hidden>
      <defs>
        <radialGradient id={id("ball")} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#FFB9D0" />
          <stop offset="50%" stopColor="#FF6F9C" />
          <stop offset="100%" stopColor="#D3376C" />
        </radialGradient>
        <linearGradient id={id("handle")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFBF0" />
          <stop offset="45%" stopColor="#FFF0D2" />
          <stop offset="100%" stopColor="#DDBE8E" />
        </linearGradient>
        <radialGradient id={id("knob")} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#BFF3E1" />
          <stop offset="55%" stopColor="#6FD5B8" />
          <stop offset="100%" stopColor="#3AA98A" />
        </radialGradient>
        <linearGradient id={id("ribbon")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE7A0" />
          <stop offset="100%" stopColor="#F0A81E" />
        </linearGradient>
      </defs>

      {/* Shake lines, kept translucent so they read as motion rather than ink.
          Without them a ball on a stick sits next to the 🍭 already in the
          backdrop and reads as a second lollipop. */}
      <g stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.55">
        <path d="M 11 21 q -6 10 0 20" />
        <path d="M 77 21 q 6 10 0 20" />
      </g>

      <rect x="38" y="42" width="13" height="28" rx="6.5" fill={`url(#${id("handle")})`} />
      <circle cx="44" cy="31" r="21" fill={`url(#${id("ball")})`} />
      <ellipse
        cx="35"
        cy="21"
        rx="8"
        ry="5.4"
        fill="#FFFFFF"
        opacity="0.85"
        transform="rotate(-28 35 21)"
      />
      <circle cx="52" cy="39" r="3" fill="#FFFFFF" opacity="0.4" />

      {/* Ribbon at the neck */}
      <path d="M 44 48 C 36 41 29 45 31 52 C 33 58 41 53 44 48 Z" fill={`url(#${id("ribbon")})`} />
      <path d="M 44 48 C 52 41 59 45 57 52 C 55 58 47 53 44 48 Z" fill={`url(#${id("ribbon")})`} />
      <circle cx="44" cy="48" r="3.4" fill="#F0A81E" />

      <circle cx="44" cy="75" r="8.5" fill={`url(#${id("knob")})`} />
      <ellipse cx="41" cy="71" rx="3" ry="2" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}
