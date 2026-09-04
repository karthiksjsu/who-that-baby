-- Timings the host can change, instead of constants only a redeploy can change.
--
-- The three phase lengths lived in `lib/game/constants.ts`. That was fine while
-- every card was the same kind of question, but the walk round asks players to
-- type a name from memory and plainly needs longer than picking one of four,
-- and the host only discovers which cards are hard while the party is running.
--
-- Two levels, because they answer different questions:
--
--   game_settings.*_ms   the defaults for the whole game
--   babies.time_limit_ms this one card gets longer, everything else unchanged
--
-- Null on a baby means "use the default", matching how `distractors` and
-- `aliases` already read in this schema, so nothing has to be backfilled and a
-- host who never opens the timing controls sees the behaviour they had before.
--
-- Only the answer clock is per-card. Reveal and intermission are the room
-- catching its breath rather than part of the question, so they stay global.

alter table game_settings
  add column if not exists question_time_ms int not null default 30000,
  add column if not exists reveal_ms int not null default 4000,
  add column if not exists intermission_ms int not null default 6000;

-- Floors rather than a free int. A sub-second question is not a question, and
-- the check runs in the database so a bad PATCH cannot brick a live game by
-- parking the room on a phase that expires before anyone can render it.
alter table game_settings
  drop constraint if exists game_settings_timings_sane,
  add constraint game_settings_timings_sane check (
    question_time_ms between 3000 and 300000
    and reveal_ms between 1000 and 60000
    and intermission_ms between 1000 and 120000
  );

alter table babies
  add column if not exists time_limit_ms int;

alter table babies
  drop constraint if exists babies_time_limit_sane,
  add constraint babies_time_limit_sane check (
    time_limit_ms is null or time_limit_ms between 3000 and 300000
  );

notify pgrst, 'reload schema';
