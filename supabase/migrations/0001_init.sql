-- "Guess the Baby" schema
create extension if not exists "pgcrypto";

create table if not exists game_settings (
  id boolean primary key default true,
  status text not null default 'draft' check (status in ('draft','live','closed')),
  winner_revealed boolean not null default false,
  choices_count int not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint single_row check (id)
);
insert into game_settings (id)
  select true
  where not exists (select 1 from game_settings);

create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  photo_url text not null,
  correct_name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_token uuid not null unique,
  created_at timestamptz not null default now()
);

create table if not exists guesses (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  baby_id uuid not null references babies(id) on delete cascade,
  guessed_name text not null,
  is_correct boolean not null,
  points int not null default 0,
  response_time_ms int not null default 0,
  created_at timestamptz not null default now(),
  unique (player_id, baby_id)
);

create index if not exists guesses_player_id_idx on guesses(player_id);
create index if not exists guesses_baby_id_idx on guesses(baby_id);
create index if not exists babies_display_order_idx on babies(display_order);

create or replace view leaderboard as
select
  p.id as player_id,
  p.name,
  coalesce(sum(g.points), 0)::int as score,
  coalesce(sum(g.response_time_ms), 0)::bigint as total_time_ms,
  count(g.id)::int as answered_count,
  max(g.created_at) as last_answer_at
from players p
left join guesses g on g.player_id = p.id
group by p.id, p.name
order by score desc, total_time_ms asc;

-- RLS enabled, no anon policies granted anywhere below.
-- All reads/writes go through server-side API routes using the service-role key.
alter table babies enable row level security;
alter table players enable row level security;
alter table guesses enable row level security;
alter table game_settings enable row level security;
