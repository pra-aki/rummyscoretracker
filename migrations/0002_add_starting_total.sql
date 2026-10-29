-- Adds starting totals to existing databases. New databases get the column
-- from schema.sql, so run this once, only against a database created before it.
--
-- Local:   npx wrangler d1 execute rummy --local --file=./migrations/0002_add_starting_total.sql
-- Remote:  npx wrangler d1 execute rummy --remote --file=./migrations/0002_add_starting_total.sql

alter table seats add column starting_total integer not null default 0;
