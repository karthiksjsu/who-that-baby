import { allocateDistractors } from "@/lib/game/allocation";
import { buildChoices } from "@/lib/game/distractors";
import type { Baby } from "@/types/db";

/**
 * How often each name is actually put in front of the room.
 *
 * A name can be in the game and still never be seen by anyone except the one
 * person whose photo it belongs to: it is the answer on its own card and a
 * wrong option on none. That is worth knowing before the party, because a name
 * nobody ever reads is a guest who never gets mentioned, and because a name
 * used as a decoy on half the cards gets guessed by elimination.
 *
 * The counts are exact rather than estimated. `buildChoices` is seeded off the
 * baby's id, so the option set computed here is the same one the server will
 * serve — pinned wrong answers included.
 */
export interface NameUsage {
  name: string;
  /** Cards where this is the correct answer. Normally 0 or 1. */
  asAnswer: number;
  /** Cards where this appears as a wrong option. */
  asDecoy: number;
  /** Every appearance, right or wrong. */
  total: number;
  /** True when the name belongs to a photo in the walk round. */
  bonusOnly: boolean;
}

export interface DistributionReport {
  rows: NameUsage[];
  /** Names that are never a wrong option anywhere. */
  neverDecoy: string[];
  /** Names that appear on no card at all, not even their own. */
  neverSeen: string[];
  /** Cards in the crawl round, which is the only round with options. */
  choiceCards: number;
  /** How many of those pin their wrong answers by hand. */
  pinnedCards: number;
}

export function optionDistribution(
  babies: Baby[],
  choicesCount: number
): DistributionReport {
  const choice = babies.filter((b) => b.round === "choice");
  /*
   * Only crawl-round names are eligible as wrong answers, because the state
   * route fetches `listBabies(pos.round)` and draws the pool from that. A
   * walk-round guest's name never appears as an option on a crawl card, so
   * counting it here would report sets the game will not serve.
   */
  const allocation = allocateDistractors(choice, choicesCount);

  const usage = new Map<string, NameUsage>();
  const ensure = (name: string, bonusOnly: boolean): NameUsage => {
    const found = usage.get(name);
    if (found) return found;
    const fresh: NameUsage = { name, asAnswer: 0, asDecoy: 0, total: 0, bonusOnly };
    usage.set(name, fresh);
    return fresh;
  };

  for (const b of babies) {
    ensure(b.correct_name, b.round === "bonus");
  }

  for (const card of choice) {
    const options = buildChoices(
      card.correct_name,
      [],
      choicesCount,
      card.id,
      allocation.get(card.id) ?? card.distractors
    );
    for (const option of options) {
      const row = ensure(option, false);
      if (option === card.correct_name) row.asAnswer += 1;
      else row.asDecoy += 1;
      row.total += 1;
    }
  }

  const rows = [...usage.values()].sort(
    (a, b) => a.total - b.total || a.asDecoy - b.asDecoy || a.name.localeCompare(b.name)
  );

  return {
    rows,
    neverDecoy: rows.filter((r) => r.asDecoy === 0).map((r) => r.name),
    neverSeen: rows.filter((r) => r.total === 0).map((r) => r.name),
    choiceCards: choice.length,
    pinnedCards: choice.filter((b) => b.distractors?.length).length,
  };
}
