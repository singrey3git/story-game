# Story Thread

A cooperative, two-player speaking-and-listening game for people learning English together. Both
players build one story by taking turns, weaving in words from a shared card deck — a card only
counts as "used" when the speaker who said it *and* the listener who heard it both mark it
independently.

No accounts, no voice/video calling built in (play over Zoom/Discord/a phone call while this is
open in a second tab), no server to run — just a static frontend on GitHub Pages talking to a
Supabase project for realtime sync.

## How it works

- **Create Game** → paste in 10–20 words or expressions, get an invite link.
- **Join Game** → your partner opens the link and types their name.
- 4 story stages (**Setup → Development → Climax → Resolution**), 2 turns each, 8 turns total,
  speaking role alternates.
- On your turn: talk through the next bit of the story out loud, tapping cards for the
  expressions **you** used.
- On their turn: listen, and independently tap the cards for the expressions **you** heard.
- Neither player sees the other's picks until the turn ends — only the overlap counts.
- Goal: finish the story *and* clear the whole deck before the last turn.

## Updating an existing project

If you already ran `schema.sql` once and are just pulling in new code, your
database is missing one column added later (`rooms.plot_id`, used by the
"spin for a plot" step). Run this once in the Supabase SQL editor:

```sql
alter table rooms add column if not exists plot_id text;
```

(Also saved as [`supabase/migration_add_plot_id.sql`](./supabase/migration_add_plot_id.sql).)

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. **Authentication → Sign In / Providers** → enable **Anonymous sign-ins**. Players are
   identified only by an anonymous session + a display name they type in, no email/password.
3. **SQL Editor → New query** → paste the contents of [`supabase/schema.sql`](./supabase/schema.sql)
   and run it. This creates the `rooms`, `players`, `cards`, and `turn_selections` tables, sets up
   row-level security, and turns on Realtime for all four tables.
4. **Project Settings → API** → copy the **Project URL** and the **anon public** key.

## 2. Configure the frontend

```bash
cp .env.example .env
```

Fill in the two values from step 1.4:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-KEY
```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL in two different browsers (or one normal + one incognito window) to
simulate two players.

## 4. Deploy to GitHub Pages

1. Push this project to a GitHub repo, e.g. `story-game`.
2. Because `.env` isn't committed, GitHub Pages needs the two Supabase values baked in at build
   time. Simplest MVP approach: build locally with your `.env` present and publish the `dist`
   folder:

   ```bash
   npm install
   npm install -D gh-pages   # already in devDependencies, this is just a note
   npm run build
   npm run deploy            # runs `gh-pages -d dist`
   ```

   `npm run deploy` pushes the built site to a `gh-pages` branch. In the repo's
   **Settings → Pages**, set the source to the `gh-pages` branch.
3. Your game will be live at:

   ```
   https://YOUR-USERNAME.github.io/story-game/
   ```

   Invite links are generated from `window.location`, so they'll automatically look like
   `https://YOUR-USERNAME.github.io/story-game/?room=ABCD12` — no extra config needed.

   (If you'd rather automate this with GitHub Actions so the anon key is pulled from a repo
   secret at build time instead of your local `.env`, that's a drop-in improvement for later —
   not required for the MVP.)

## Project structure

```
src/
  App.jsx              room lifecycle, realtime subscriptions, screen routing
  supabaseClient.js     Supabase client singleton
  hooks/usePresence.js  live "is my partner's tab open" indicator
  lib/gameLogic.js      stages, turn/speaker math, room codes, word-list parsing
  lib/session.js        localStorage session so a page refresh rejoins the same room
  screens/              Home, JoinForm, Lobby, GameBoard, Results
  components/           Card, StageThread, TurnResult
supabase/schema.sql      tables, RLS policies, realtime publication
```

## Data model

- **rooms** — one row per game: status (`lobby`/`playing`/`finished`), which player speaks first,
  the current turn number (1–8), and the current turn phase.
- **players** — up to two rows per room (`player_number` 1 = host, 2 = joiner).
- **cards** — the vocabulary deck; `status` flips from `available` to `validated` once a turn's
  picks match, along with which stage/turn it was confirmed in.
- **turn_selections** — one row per (turn, player, card, `speaker_claim`/`listener_heard`). A card
  is confirmed when a `speaker_claim` and a `listener_heard` row exist for the same turn and card.

Turn phase state machine (stored on `rooms.turn_phase`):

```
active            both players can mark cards; speaker can End Turn
  → awaiting_confirm   listener finishes marking, taps Confirm
    → reviewing        server-computed overlap shown to both; either taps Continue
      → active (next turn)  or  finished (after turn 8)
```

## What's intentionally left out of this MVP

Per the design brief: no real accounts, no voice/video calling, no speech recognition or
recording, no chat, no scoring of one player against the other, no matchmaking. The site is a
shared game board — the conversation itself happens on whatever call the two players are already
on.

## Manual test checklist

1. Open the site on computer A → **Create Game** → paste 10–15 expressions → copy the invite link.
2. Open the link on computer B → enter a name → **Join Game**. Both screens show `2 / 2 players
   connected`.
3. Host taps **Start Game**.
4. Player A speaks and taps the cards they used; Player B independently taps the cards they hear —
   neither sees the other's picks.
5. Player A taps **End Turn**; Player B taps **Confirm what I heard**.
6. Only the overlapping cards move to "validated" and disappear from the active deck; the rest
   stay in play.
7. Roles swap automatically for the next turn.
8. Refresh either browser mid-game — you rejoin the same room, name, and role.
9. After turn 8, both browsers land on the same results screen (`Story Complete!` or `Story
   finished` with a used/total count) — never "Player 1 won."
