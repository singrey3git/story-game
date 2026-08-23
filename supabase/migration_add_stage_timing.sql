-- Migration: adds per-stage timing so the game can show a live stopwatch
-- while a stage is being narrated, and a per-stage duration breakdown at
-- the end. Safe to run even if already applied.

alter table rooms add column if not exists turn_started_at timestamptz;
alter table rooms add column if not exists stage_durations jsonb not null default '{}'::jsonb;
