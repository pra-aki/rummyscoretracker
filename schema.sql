-- Rummy scorekeeper schema (Cloudflare D1 / SQLite).
--
-- Apply locally:   npx wrangler d1 execute rummy --local --file=./schema.sql
-- Apply remotely:  npx wrangler d1 execute rummy --remote --file=./schema.sql
--
-- Only raw inputs are stored. Scores are always recomputed from values and
-- penalties, so a scoring fix retroactively corrects existing games.

create table if not exists games (
  id         text primary key,
  name       text,
  created_at integer not null,
  updated_at integer not null
);

create table if not exists seats (
  game_id      text    not null references games(id) on delete cascade,
  seat_index   integer not null,
  display_name text    not null,
  primary key (game_id, seat_index)
);

create table if not exists rounds (
  id          text    primary key,
  game_id     text    not null references games(id) on delete cascade,
  -- Assigned by the server as max + 1, never by the client. The unique
  -- constraint is what stops two simultaneous writers creating the same round.
  round_index integer not null,
  declarer    integer not null,
  created_at  integer not null,
  unique (game_id, round_index)
);

create table if not exists round_entries (
  round_id   text    not null references rounds(id) on delete cascade,
  seat_index integer not null,
  value      integer not null default 0,
  penalty    integer not null default 0,
  primary key (round_id, seat_index)
);

create index if not exists idx_rounds_game on rounds (game_id, round_index);
create index if not exists idx_seats_game on seats (game_id, seat_index);
