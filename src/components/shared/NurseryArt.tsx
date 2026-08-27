/**
 * Nursery objects that Unicode has no emoji for.
 *
 * There is no pacifier and no rattle in the emoji set — 🪀 is a yo-yo, and the
 * nearest baby-adjacent glyphs (🍼 👶 🧸) are already used in the backdrop.
 * These are drawn in the same sticker language as the babies on the progress
 * trail: flat fills plus a dark keyline.
 *
 * Each takes a `className` for sizing and inherits nothing else, so they look
 * identical wherever they appear.
 */

const OUTLINE = "#5A3320";
const PINK = "#FF6F9C";
const CREAM = "#FFF6E4";
const TEAT = "#FFD9A8";
const MINT = "#7FDCC0";
const RIBBON = "#FFC93F";

/**
 * A pacifier.
 *
 * Three details do the work. The ring is one annulus path with `evenodd`
 * rather than stacked circles, so it reads as a solid handle instead of a
 * blur of concentric lines. The shield is wide and flat with two vent holes.
 * The teat narrows into a neck before swelling into a bulb — that pinch is
 * what separates a pacifier from a hand mirror; a flat blob under an ellipse
 * doesn't read at all.
 */
export function PacifierIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 76 92" className={className} aria-hidden>
      {/* Ring handle */}
      <path
        d="M 38 1 A 13 13 0 1 1 37.99 1 Z M 38 7.5 A 6.5 6.5 0 1 0 38.01 7.5 Z"
        fillRule="evenodd"
        fill={PINK}
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <g stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round">
        {/* Stem joining ring to shield */}
        <rect x="33" y="24" width="10" height="11" rx="3" fill={PINK} />
        {/* Shield */}
        <ellipse cx="38" cy="46" rx="30" ry="16" fill={CREAM} />
        {/* Teat: neck, then bulb */}
        <path d="M 31 59 C 31 65 26 67 26 74 C 26 82 31 87 38 87 C 45 87 50 82 50 74 C 50 67 45 65 45 59 Z" fill={TEAT} />
      </g>
      {/* Vent holes */}
      <circle cx="21" cy="43" r="3.4" fill="#E9C9A0" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="55" cy="43" r="3.4" fill="#E9C9A0" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="30" cy="40" rx="7" ry="3.4" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

/**
 * A baby rattle.
 *
 * The shake lines and the ribbon are load-bearing, not decoration: a plain
 * ball on a stick sits next to the 🍭 already in the backdrop and reads as a
 * second lollipop. The motion is what names the object.
 */
export function RattleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 88 88" className={className} aria-hidden>
      {/* Shake lines */}
      <g stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85">
        <path d="M 10 20 q -6 10 0 20" />
        <path d="M 78 20 q 6 10 0 20" />
      </g>
      <g stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round">
        <rect x="38" y="40" width="12" height="28" rx="6" fill={CREAM} />
        <circle cx="44" cy="30" r="20" fill={PINK} />
        <circle cx="44" cy="73" r="7.5" fill={MINT} />
        {/* Ribbon at the neck */}
        <path d="M 44 46 C 36 40 30 44 32 50 C 34 55 41 51 44 46 Z" fill={RIBBON} />
        <path d="M 44 46 C 52 40 58 44 56 50 C 54 55 47 51 44 46 Z" fill={RIBBON} />
      </g>
      <circle cx="36" cy="23" r="4.5" fill="#FFFFFF" opacity="0.75" />
      <circle cx="50" cy="35" r="2.6" fill="#FFFFFF" opacity="0.5" />
    </svg>
  );
}
