-- Players now answer each baby up to twice: once in the main multiple-choice
-- round, once (optionally) in the free-text bonus round. Replace the old
-- one-guess-per-baby uniqueness with one-guess-per-baby-per-round.
do $$
declare
  con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'guesses'::regclass
    and contype = 'u'
    and array_length(conkey, 1) = 2;
  if con_name is not null then
    execute format('alter table guesses drop constraint %I', con_name);
  end if;
end $$;

alter table guesses add column if not exists round text not null default 'choice'
  check (round in ('choice', 'bonus'));

alter table guesses add constraint guesses_player_baby_round_key
  unique (player_id, baby_id, round);
