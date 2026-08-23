-- Migration: allows recording which cards each player marks as "new to me"
-- before the game starts (used for turn_number = 0), so end-of-game stats
-- can show how many of those words made it into the story.
-- Safe to run even if already applied.

alter table turn_selections drop constraint if exists turn_selections_selection_type_check;
alter table turn_selections
  add constraint turn_selections_selection_type_check
  check (selection_type in ('speaker_claim', 'listener_heard', 'marked_unfamiliar'));
