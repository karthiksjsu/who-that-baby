-- Each baby now belongs to exactly one round: the multiple-choice main round,
-- or the free-text bonus round. Existing babies default to the main round.
alter table babies add column if not exists round text not null default 'choice'
  check (round in ('choice', 'bonus'));
