-- Per-baby answer options.
--
-- The wrong answers on a card were always drawn automatically from the other
-- babies' names. That is a fine default and stays the default, but the host
-- knows things the generator does not — that two cousins are indistinguishable
-- at eight months old, that a particular pairing is the joke of the evening —
-- so they can now pin the wrong answers for any single card.
--
-- Null means "decide for me": the card falls back to the generated set, which
-- is what every existing row wants. The correct name is never stored here; it
-- is always added and shuffled in at serve time, so a host cannot accidentally
-- leave the right answer out of its own question.
alter table babies
  add column if not exists distractors text[];
