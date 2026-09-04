import { hashSeed, seededShuffle } from "@/lib/game/distractors";
import type { Baby } from "@/types/db";

/**
 * Hands out the wrong answers across the whole round at once.
 *
 * The original generator chose each card's decoys on its own, seeded off that
 * card's id. Every card was individually fair and the deck as a whole was not:
 * on a 32-card round with 39 names, some people were offered five times and
 * four were never offered at all. A name that never appears as a wrong answer
 * is a guest the room never reads, and a name that appears five times starts
 * to get picked by elimination.
 *
 * Fixing that needs a view of every card at once, which is why this is a
 * separate pass rather than a change inside `buildChoices`.
 *
 * Two properties matter as much as the balance itself:
 *
 * Determinism. Every state request recomputes the options, and a player who
 * reloads mid-question must be handed the same four names in the same order.
 * Nothing here reads a clock or a random source; the only entropy is a hash of
 * the card id, so the same deck always allocates identically.
 *
 * Deference. A card whose wrong answers the host pinned by hand is left
 * exactly as they set it. Those names still count toward the totals, so the
 * generated cards fill in around the host's choices rather than ignoring them
 * and doubling somebody up.
 */

/** Cards in a stable order, so allocation does not depend on fetch order. */
function inDeckOrder(cards: Baby[]): Baby[] {
  return [...cards].sort(
    (a, b) => a.display_order - b.display_order || a.id.localeCompare(b.id)
  );
}

/**
 * Wrong answers for every card in a round, keyed by baby id.
 *
 * `names` is the pool of eligible wrong answers — the correct names of the
 * cards in this round, matching what the game serves. A card never receives
 * its own answer, and never the same name twice.
 */
export function allocateDistractors(
  cards: Baby[],
  choicesCount: number
): Map<string, string[]> {
  const wanted = Math.max(0, choicesCount - 1);
  const deck = inDeckOrder(cards);
  const pool = Array.from(new Set(deck.map((c) => c.correct_name.trim()).filter(Boolean)));

  const used = new Map<string, number>(pool.map((n) => [n, 0]));
  const out = new Map<string, string[]>();

  /*
   * The host's cards are settled first, and their names are charged to the
   * running totals before anything is generated. Doing it in this order is
   * what lets the generated cards compensate — if the host has already used
   * one name three times, the allocator sees that and stops offering it.
   */
  const needsFilling: Baby[] = [];
  for (const card of deck) {
    const pinned = card.distractors?.length
      ? Array.from(
          new Set(
            card.distractors
              .map((n) => n.trim())
              .filter((n) => n && n !== card.correct_name)
          )
        )
      : [];
    out.set(card.id, pinned);
    for (const name of pinned) used.set(name, (used.get(name) ?? 0) + 1);
    /*
     * Short lists get topped up, not served short. A pinned list can come up
     * under the required count — most often because one of the pinned names is
     * the card's own answer and gets dropped — and serving it as-is puts three
     * options on that card while every other card has four, which makes it
     * quietly easier to guess. Filling is additive: nothing the host chose is
     * removed here.
     */
    if (pinned.length < wanted) needsFilling.push(card);
  }

  for (const card of needsFilling) {
    /*
     * Tie-break by a per-card shuffle rather than alphabetically. Early in the
     * round every count is zero, and picking the first names in the pool every
     * time would give the first few cards a near-identical set of options.
     */
    const candidates = seededShuffle(
      pool.filter((n) => n !== card.correct_name),
      hashSeed(card.id)
    );

    const chosen: string[] = [...(out.get(card.id) ?? [])];
    while (chosen.length < wanted) {
      /*
       * Least-used-first, recomputed after each pick so a card cannot take the
       * same rare name twice and so the second pick already accounts for the
       * first. Linear scans over a party-sized pool; no need for a heap.
       */
      let best: string | null = null;
      let bestCount = Infinity;
      for (const name of candidates) {
        if (chosen.includes(name)) continue;
        const count = used.get(name) ?? 0;
        if (count < bestCount) {
          best = name;
          bestCount = count;
        }
      }
      if (best === null) break;
      chosen.push(best);
      used.set(best, bestCount + 1);
    }
    out.set(card.id, chosen);
  }

  return out;
}

export interface PinSwap {
  cardId: string;
  /** The card's correct answer, so the admin can name the card it is changing. */
  cardName: string;
  /** The over-used name being taken off this card. */
  from: string;
  /** The under-used name replacing it. */
  to: string;
}

export interface Rebalance {
  swaps: PinSwap[];
  /** The pinned lists after the swaps, keyed by baby id — only changed cards. */
  updated: Map<string, string[]>;
  before: { min: number; max: number; stdev: number };
  after: { min: number; max: number; stdev: number };
}

/**
 * Evens out a deck whose pinned cards are lopsided, by editing the pins.
 *
 * `allocateDistractors` treats a pinned card as immovable, which is right by
 * default — silently rewriting something the host set by hand is worse than a
 * visible imbalance. But when the pins themselves are the imbalance, the only
 * way to flatten the deck is to change some of them, and this works out which
 * ones.
 *
 * It returns the proposed changes rather than performing them. Nothing here
 * writes; the admin previews the swaps and decides.
 *
 * The strategy is deliberately minimal-touch: repeatedly take the most
 * over-used name, find one pinned card carrying it that could take the most
 * under-used name instead, and swap that single entry. Each pass narrows the
 * gap by one, so it changes about as few pins as the imbalance requires rather
 * than reshuffling everything.
 */
export function rebalancePins(cards: Baby[], choicesCount: number): Rebalance {
  const deck = inDeckOrder(cards);
  const byId = new Map(deck.map((c) => [c.id, c]));
  const pool = Array.from(new Set(deck.map((c) => c.correct_name.trim()).filter(Boolean)));

  const current = allocateDistractors(deck, choicesCount);
  const options = new Map<string, string[]>([...current].map(([id, ds]) => [id, [...ds]]));

  const counts = new Map<string, number>(pool.map((n) => [n, 0]));
  for (const list of options.values()) {
    for (const name of list) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const before = spreadOf([...counts.values()]);

  /** Only cards the host pinned are eligible to be edited. */
  const pinnedIds = new Set(
    deck.filter((c) => c.distractors?.length).map((c) => c.id)
  );

  const swaps: PinSwap[] = [];
  const changed = new Set<string>();

  // Bounded rather than `while (true)`: every pass strictly reduces the gap,
  // but a deck with no legal swap left must still terminate.
  const maxPasses = deck.length * Math.max(1, choicesCount) * 4;
  for (let pass = 0; pass < maxPasses; pass++) {
    const ranked = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
    const [, hi] = ranked[0] ?? ["", 0];
    const [, lo] = ranked[ranked.length - 1] ?? ["", 0];
    if (hi - lo <= 1) break;

    let did = false;
    // Walk over-used names from worst down, and under-used from best up, so a
    // name that cannot legally move does not stall the whole process.
    for (const [over, overCount] of ranked) {
      if (overCount - lo <= 1) break;
      for (let j = ranked.length - 1; j >= 0; j--) {
        const [under, underCount] = ranked[j];
        if (overCount - underCount <= 1) break;
        const cardId = deck.find((c) => {
          if (!pinnedIds.has(c.id)) return false;
          const list = options.get(c.id);
          if (!list?.includes(over)) return false;
          if (list.includes(under)) return false;
          return under !== c.correct_name;
        })?.id;
        if (!cardId) continue;

        const list = options.get(cardId)!;
        list[list.indexOf(over)] = under;
        counts.set(over, overCount - 1);
        counts.set(under, underCount + 1);
        swaps.push({
          cardId,
          cardName: byId.get(cardId)?.correct_name ?? "",
          from: over,
          to: under,
        });
        changed.add(cardId);
        did = true;
        break;
      }
      if (did) break;
    }
    if (!did) break;
  }

  return {
    swaps,
    updated: new Map([...changed].map((id) => [id, options.get(id)!])),
    before,
    after: spreadOf([...counts.values()]),
  };
}

/** How lopsided an allocation is, for the admin table and for tests. */
export function spreadOf(counts: number[]): { min: number; max: number; stdev: number } {
  if (counts.length === 0) return { min: 0, max: 0, stdev: 0 };
  const mean = counts.reduce((s, n) => s + n, 0) / counts.length;
  const variance = counts.reduce((s, n) => s + (n - mean) ** 2, 0) / counts.length;
  return {
    min: Math.min(...counts),
    max: Math.max(...counts),
    stdev: Math.sqrt(variance),
  };
}
