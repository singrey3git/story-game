-- Migration: add turn_transcripts column for live speech-to-text transcripts
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query)
-- if your rooms table was created before this change.

alter table rooms
  add column if not exists turn_transcripts jsonb not null default '{}'::jsonb;
