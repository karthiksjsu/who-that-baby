/**
 * Extra answers the walk round will accept, and how to guess at them safely.
 *
 * The bonus round asks players to type a name from memory, so it has to decide
 * what counts as the same name. Doing that automatically — typo distance,
 * always accepting the first name — is tempting and wrong on a real family
 * roster, where several people share a first name and one person's first name
 * is another person's whole name. Getting that wrong is worse than being
 * strict, because it hands points to a guess that named the wrong person.
 *
 * So the generator here is deliberately timid. It only proposes a shortening
 * when that shortening cannot possibly refer to anyone else in the game, and
 * it says which ones it withheld so the host can decide those by hand.
 */

/** Case- and whitespace-insensitive, so "priya  sharma" matches "Priya Sharma". */
export function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** The leading word of a name — "Sahana" out of "Sahana Gautam". */
function firstWord(name: string): string {
  return normalize(name).split(" ")[0] ?? "";
}

export interface AliasSuggestion {
  /** Safe to accept: no one else in the game answers to this. */
  suggested: string[];
  /**
   * Shortenings that were withheld because another player's card could also
   * be answered with them, paired with who they collide with. Surfaced so the
   * host sees a reason rather than an empty list.
   */
  withheld: { alias: string; collidesWith: string[] }[];
}

/**
 * Conservative extra answers for one card.
 *
 * The only shortening proposed is the first name on its own, and only when no
 * other name in the game starts with it and no other name *is* it. "Karthik"
 * is the whole name, so there is nothing to add; "Priyanka chopra" yields
 * "Priyanka" if no other Priyanka exists; "Sahana Gautam" yields nothing at
 * all, because "Sahana ganesh" would answer to the same word.
 *
 * Case and inner spacing are not included — the matcher already ignores both,
 * so listing them would be noise the host has to read past.
 */
export function suggestAliases(correctName: string, allNames: string[]): AliasSuggestion {
  const canonical = normalize(correctName);

  // A single-word name has no shorter form to offer.
  if (canonical.split(" ").filter(Boolean).length < 2) {
    return { suggested: [], withheld: [] };
  }

  /*
   * Compared lowercased, but shown to the host as they typed it. Matching
   * ignores case either way, so this is purely so the panel offers "Priyanka"
   * rather than a chip reading "priyanka" that looks like a bug.
   */
  const display = correctName.trim().split(/\s+/)[0];
  const first = normalize(display);
  const others = allNames.filter((n) => normalize(n) !== canonical);

  const collidesWith = others.filter(
    (n) => normalize(n) === first || firstWord(n) === first
  );

  if (collidesWith.length > 0) {
    return { suggested: [], withheld: [{ alias: display, collidesWith }] };
  }
  return { suggested: [display], withheld: [] };
}

/**
 * Does a typed guess answer this card?
 *
 * The correct name is always accepted and is never required to appear in the
 * alias list, so clearing the list weakens the card rather than breaking it.
 */
export function matchesAnswer(
  guess: string,
  correctName: string,
  aliases: string[] | null | undefined
): boolean {
  const g = normalize(guess);
  if (g === normalize(correctName)) return true;
  return (aliases ?? []).some((a) => normalize(a) === g);
}
