-- Story Thread — database schema for Supabase
-- Run this whole file once in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- Before running:
--   Project Settings → Authentication → Sign In / Providers → enable "Anonymous sign-ins".
-- After running:
--   Project Settings → API → copy the Project URL and anon public key into your .env file.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists rooms (
  id                uuid primary key default gen_random_uuid(),
  room_code         text unique not null,
  host_user_id      uuid not null,
  status            text not null default 'lobby'
                       check (status in ('lobby', 'playing', 'finished')),
  first_speaker     int check (first_speaker in (1, 2)),
  plot_id           text,
  current_turn      int not null default 1,
  turn_phase        text not null default 'active'
                       check (turn_phase in ('active', 'awaiting_confirm', 'reviewing', 'finished')),
  last_turn_result  jsonb,
  created_at        timestamptz not null default now()
);

create table if not exists players (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references rooms(id) on delete cascade,
  user_id       uuid not null,
  display_name  text not null,
  player_number int not null check (player_number in (1, 2)),
  connected     boolean not null default true,
  last_seen     timestamptz not null default now(),
  unique (room_id, player_number),
  unique (room_id, user_id)
);

create table if not exists cards (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references rooms(id) on delete cascade,
  text             text not null,
  order_index      int not null default 0,
  status           text not null default 'available'
                      check (status in ('available', 'validated')),
  validated_stage  int,
  validated_turn   int
);

create table if not exists turn_selections (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid not null references rooms(id) on delete cascade,
  turn_number     int not null,
  player_id       uuid not null references players(id) on delete cascade,
  card_id         uuid not null references cards(id) on delete cascade,
  selection_type  text not null check (selection_type in ('speaker_claim', 'listener_heard')),
  created_at      timestamptz not null default now(),
  unique (room_id, turn_number, player_id, card_id, selection_type)
);

create index if not exists idx_players_room on players(room_id);
create index if not exists idx_cards_room on cards(room_id);
create index if not exists idx_selections_room_turn on turn_selections(room_id, turn_number);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- MVP trust model: two people already sharing a private invite link/voice
-- call. Room codes are long random strings, so the practical protection is
-- "you need the link to find the room". Within a room, both players can read
-- each other's rows (the UI simply doesn't render partner selections until a
-- turn is confirmed) rather than enforcing cryptographic secrecy — good
-- enough for a cooperative two-person game, and it keeps the policies simple.
-- Writes are restricted to people who hold a player row in that room.
-- ---------------------------------------------------------------------------

alter table rooms enable row level security;
alter table players enable row level security;
alter table cards enable row level security;
alter table turn_selections enable row level security;

-- rooms: anyone signed in (incl. anonymously) can look a room up by code,
-- and can create a room as its host. Only members can update it.
create policy "rooms_select_all" on rooms
  for select using (true);

create policy "rooms_insert_as_host" on rooms
  for insert with check (auth.uid() = host_user_id);

create policy "rooms_update_by_members" on rooms
  for update using (
    auth.uid() = host_user_id
    or id in (select room_id from players where user_id = auth.uid())
  );

-- players: readable by anyone with the room id (needed to show both names
-- before you've necessarily inserted your own row). You can only insert or
-- update your own row.
create policy "players_select_all" on players
  for select using (true);

create policy "players_insert_self" on players
  for insert with check (auth.uid() = user_id);

create policy "players_update_self" on players
  for update using (auth.uid() = user_id);

-- cards: readable by anyone with the room id. Only the host can add/remove
-- cards, and only while the room is still in the lobby. Any member of the
-- room can update card status (used when a turn is confirmed).
create policy "cards_select_all" on cards
  for select using (true);

create policy "cards_insert_by_host" on cards
  for insert with check (
    room_id in (
      select id from rooms where host_user_id = auth.uid() and status = 'lobby'
    )
  );

create policy "cards_delete_by_host" on cards
  for delete using (
    room_id in (
      select id from rooms where host_user_id = auth.uid() and status = 'lobby'
    )
  );

create policy "cards_update_by_members" on cards
  for update using (
    room_id in (select room_id from players where user_id = auth.uid())
  );

-- turn_selections: readable by anyone with the room id. You can only
-- insert/delete your own selections (your own player_id).
create policy "selections_select_all" on turn_selections
  for select using (true);

create policy "selections_insert_self" on turn_selections
  for insert with check (
    player_id in (select id from players where user_id = auth.uid())
  );

create policy "selections_delete_self" on turn_selections
  for delete using (
    player_id in (select id from players where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table turn_selections;
