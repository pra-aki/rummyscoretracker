-- Adds per-player skipping to existing databases. New databases get the column
-- from schema.sql, so run this once, only against a database created before it.
--
-- Local:   npx wrangler d1 execute rummy --local --file=./migrations/0001_add_skipped.sql
-- Remote:  npx wrangler d1 execute rummy --remote --file=./migrations/0001_add_skipped.sql

alter table round_entries add column skipped integer not null default 0;
