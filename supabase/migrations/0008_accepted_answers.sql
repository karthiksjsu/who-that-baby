-- Extra answers the walk round will accept as correct.
--
-- The bonus round has players type the name from scratch, and the check was an
-- exact match once case and repeated spaces were normalised away. That is
-- harsher than the game intends. A guest who knows perfectly well that the
-- photo is Sahana Gautam, and types "Sahana", was being marked wrong for
-- knowing the answer but not the surname.
--
-- Loosening the match automatically is not safe on a roster like this one:
-- two people share the first name Sahana, two share Sai, and Ganesh and
-- Gautam each also exist as whole names of their own. A rule that accepted
-- first names would mark the same guess correct for two different photos. So
-- the extra answers are curated per card by the host instead, from a
-- conservative set of suggestions that skips exactly those collisions.
--
-- Null means "only the exact name", which is what every existing row wants.
-- The correct name itself is never stored here — it is always accepted, so a
-- host cannot break a card by emptying this list.
alter table babies
  add column if not exists aliases text[];

notify pgrst, 'reload schema';
