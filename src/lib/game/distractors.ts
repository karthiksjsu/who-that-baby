/** Small deterministic string hash -> 32-bit seed. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG so the same player sees the same shuffled choices on reload. */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds the multiple-choice list for one baby card: the correct name plus
 * up to `choicesCount - 1` distractors drawn from the other babies' real
 * names, deterministically shuffled per (player, baby) so a reload doesn't
 * reshuffle the options mid-answer.
 */
export function buildChoices(
  correctName: string,
  otherNames: string[],
  choicesCount: number,
  seedInput: string
): string[] {
  const pool = Array.from(new Set(otherNames.filter((n) => n !== correctName)));
  const seed = hashSeed(seedInput);
  const shuffledPool = seededShuffle(pool, seed);
  const distractors = shuffledPool.slice(0, Math.max(0, choicesCount - 1));
  const choices = seededShuffle([correctName, ...distractors], seed + 1);
  return choices;
}
