-- Synchronized rounds: the server owns which card is live and when it started.
--
-- Previously each player fetched the whole deck and walked their own queue with
-- a client-side clock, so two guests could be looking at different babies. The
-- columns below make the game position server-authoritative; clients render
-- whatever these say and derive their countdown from `phase_started_at` rather
-- than from their own `Date.now()`.

alter table game_settings
  add column if not exists current_round text not null default 'choice'
    check (current_round in ('choice','bonus')),
  add column if not exists current_index int not null default 0,
  add column if not exists phase text not null default 'idle'
    check (phase in ('idle','question','reveal','intermission','finished')),
  add column if not exists phase_started_at timestamptz;

-- Advancing is a compare-and-set on (current_round, current_index, phase): every
-- client races to advance when its clock passes the deadline, and only the first
-- update matches. Without this index that predicate is a seq scan on every
-- attempt — cheap on a single row, but the index also documents the access path.
create index if not exists game_settings_position_idx
  on game_settings (current_round, current_index, phase);

-- A game already mid-flight when this migration lands has no phase timestamp.
-- Leave it idle so the host explicitly restarts rather than the first client to
-- poll computing a deadline from a null and advancing immediately.
update game_settings
   set phase = 'idle',
       current_index = 0,
       current_round = 'choice',
       phase_started_at = null
 where phase_started_at is null;
