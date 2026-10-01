# NO FOLD

NO FOLD is a multiplayer social pressure game. Players receive awkward scenarios
and private response cards, defend their chosen response, then decide whether to
CALL or FOLD. The phone deals, referees, tracks score, and applies pressure while
the table conversation stays central.

## Current Milestone

M03.5 stabilizes the realtime multiplayer prototype after full multi-round play.
Rooms, players, response locks, defense timers, CALL/FOLD, Normal, Stand Alone,
Coward / No Escape, cumulative scoring, Judge rotation, final scoreboard, replay,
and pack-return flows are persisted through Supabase. `/demo` remains a local
deterministic harness.

## Stack

- Vite
- React
- TypeScript
- React Router
- Supabase JavaScript client

## M01.1 — Privy Foundation

The isolated `/auth-test` route verifies optional email/Google authentication,
automatic embedded Solana wallet provisioning, the authenticated user's wallet
address, and logout. Open it directly; it is not linked from the player journey.
It is a diagnostic, not a Player Passport or a saved player profile.

Set `VITE_PRIVY_APP_ID` in the ignored local `.env` and restart Vite. For a hosted
build, set it in that deployment's environment and rebuild. The app ID is public;
do not add a Privy app secret or Google client secret to any `VITE_*` variable.
When the app ID is missing, guest routes still render and `/auth-test` explains
that authentication is unavailable.

Dashboard configuration for this milestone is already complete: email and Google
login, SVM/Solana wallets, and automatic embedded wallet creation for all users
are enabled; EVM wallets are disabled. The frontend explicitly uses
`embeddedWallets.solana.createOnLogin: "all-users"` and disables Ethereum wallet
creation. The Privy login modal is intentional: automatic wallet creation does
not run through the direct custom email/OAuth login hooks.

If domain or OAuth redirect restrictions are configured in Privy, they must
permit the actual local/deployment origin and OAuth return URL. No separate
Solana RPC URL, wallet funding, transaction, or signature is required here.

Privy has no connection to the Supabase client or NO FOLD player storage.
`nofold_player_id`, `nofold_player_name`, existing room membership, anon requests,
realtime subscriptions, gameplay, and scoring retain their existing behavior.
Neither login nor logout links a guest to an account or changes the guest UUID.
Authentication readiness never gates the router. SDK hooks and status are used
only by the diagnostic screen. M01.2 is not implemented.

### Manual acceptance checks

1. Run `npm run dev` and use the exact local URL Vite prints. Open `/auth-test`.
   Wait for **Privy SDK: Ready** and **Authentication: Guest / signed out**.
2. Click **Sign in with email or Google**, choose email, enter an email address,
   and enter the OTP received in that inbox. Expect **Signed in**, a Privy user
   ID, **Embedded Solana wallet: Provisioned**, and a full Solana address.
   **Wallet connection: Ready** confirms the connected wallet matches the
   authenticated user's embedded wallet. Use an account that has never signed
   into this Privy app to specifically test first-time automatic provisioning.
3. Record the user ID and address. Refresh `/auth-test`; after initialization,
   expect the same authenticated user and address. Navigate to `/` and back to
   `/auth-test` directly and check again.
4. Click **Sign out**. Expect **Guest / signed out**, user ID/address replaced by
   dashes, and the sign-in button available. Refresh and verify it remains signed
   out. Sign in with the same email again and confirm the original address is
   reused.
5. Sign out, then open the modal and choose **Google**. Complete Google's account
   selection/consent flow. Repeat the provisioning, refresh, logout, and relogin
   checks. Compare each login method with its own previous user/address; do not
   assume unrelated email and Google accounts represent the same Privy user.
6. Cancel a login attempt and confirm the diagnostic remains usable and `/create`
   and `/join` remain accessible. Authentication success without a wallet must
   not count as provisioning success: the screen reports the missing wallet
   separately. If it persists, sign out/in to retry automatic provisioning.
7. Guest regression: before signing in, create/join a room and record
   `nofold_player_id` and `nofold_player_name` in browser devtools. Keep the room
   open and open `/auth-test` in another tab on the same origin. Sign in and out;
   confirm those NO FOLD storage values and the room membership remain unchanged.
   With three separate browser identities, verify realtime play, response locks,
   CALL/FOLD, score updates, refresh recovery, and replay still work as before.
   Close the diagnostic and verify guest create/join/play requires no login.

Run `npm test` and `npm run build` for automated regression and build checks.
Live email delivery, Google OAuth, provisioning, and session restoration require
the browser checks above; passing a build does not verify them.

Official references: [SDK installation](https://docs.privy.io/basics/react/installation),
[automatic wallet creation](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation),
and [linked versus connected wallets](https://docs.privy.io/wallets/wallets/get-a-wallet/get-connected-wallet).

## Environment

Create a local `.env` from `.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PRIVY_APP_ID=
```

Do not commit real Supabase keys.

## Supabase Setup

Apply the migrations in:

```bash
supabase/migrations/
```

The latest M03.5 migration is:

```bash
supabase/migrations/20260917120000_m03_5_session_replay_and_hands.sql
```

It adds replay-safe session identity and private hand persistence:

- `game_sessions.scenario_order`: canonical shuffled scenario order per session
- session-scoped keys on rounds, responses, decisions, and scores
- `game_round_hands`: one private response hand per player per round/session
- prototype RLS for hand rows using the browser `nofold_player_id` header

- `rooms`: room code, host player reference, status, selected pack, timestamps
- `room_players`: display name, local browser player UUID, host flag, timestamps
- `game_round_responses`: one response-lock row per room, round, and active player
- `game_rounds`: one canonical row per room/round for phase, Judge, defense order,
  current defender index, and `defense_started_at`

The migration also enables simple prototype RLS policies for anonymous clients.
Because M03.1 intentionally has no authentication, these policies are not a
production security model. Later milestones should replace them with authenticated
or signed room-member authorization before syncing gameplay actions.

## Room Persistence

The create table flow:

1. Trims the host nickname.
2. Creates or reuses `nofold_player_id` in browser `localStorage`.
3. Generates a collision-safe short room code such as `NF7KQ2`.
4. Inserts a `rooms` row.
5. Inserts the host `room_players` row.
6. Updates `rooms.host_player_id`.
7. Navigates to `/room/:roomCode`.

The join flow:

1. Normalizes room code casing and whitespace.
2. Looks up the room in Supabase.
3. Creates or reuses the browser player identity.
4. Reuses the existing `room_players` row for that browser if present.
5. Rejects joins when the room already has 6 players.
6. Navigates to `/room/:roomCode`.

Refreshing `/room/:roomCode` refetches the room and players from Supabase, restores
host/non-host role from `host_player_id`, reconnects realtime subscriptions, and
does not duplicate the local player.

Lobby realtime listens for:

- `rooms` changes scoped to the current room id
- `room_players` inserts, updates, and deletes scoped to the current room id

When either subscription receives an event, the app refetches the canonical room
state instead of mutating local arrays from event payloads. Manual refresh remains
available as a development fallback.

Round response realtime listens for `game_round_responses` changes scoped to the
current room id. On any insert, update, or delete, the app refetches canonical
round response rows for the current round. Player lock writes upsert by session,
round, and player so refreshes and replays do not create duplicate locks.

Round realtime listens for `game_rounds` changes scoped to the current room id.
When every active non-Judge player has locked a response, clients attempt to
create the round row. The unique `(room_id, round_number)` constraint makes this
safe under races. Defense order is persisted once from the room player order,
excluding the Judge.

The current defender starts the shared timer by writing `defense_started_at`.
Every client derives the countdown from that timestamp. When it reaches zero, the
current defender client submits an idempotent guarded advance for the expected
phase/index. The next defender is selected by incrementing `current_defender_index`;
after the last defender, the canonical phase becomes `CALL_FOLD`.

The UI boundary intentionally exposes only:

- each active player's locked/unlocked status to the Judge
- the current player's own `selected_response_id` back to that player

Because the prototype still has no authentication, the current anon RLS policies
cannot fully enforce per-player response secrecy at the database level. The UI
does not render other players' selected responses, and production hardening must
add authenticated or signed membership checks before shipping.

Private response hands are persisted in `game_round_hands` and read only by the
owning browser identity in this prototype. The `x-nofold-player-id` request
header is spoofable and is not a production security boundary.

## Replay And Session Variety

At session creation the app persists a shuffled `scenario_order`, so all clients
see the same scenario sequence and an 8-round Table Trouble game can run without
scenario repeats. Replays create a fresh session identity and fresh score rows
instead of overwriting previous round history.

The final scoreboard supports:

- `PLAY AGAIN`: same room and players, same selected pack, scores reset, new
  scenario order, Round 1 starts again
- `TRY ANOTHER PACK`: same room and players, returns host to pack selection with
  a fresh session identity ready
- `BACK TO HOME`: returns to `/`

## Local Gameplay Demo

Open `/demo` for the full deterministic M01 gameplay harness. It remains local and
does not use Supabase.

Use the normal routes for persisted onboarding:

- `/` welcome / QR entry
- `/create` create a Supabase-backed table
- `/join` join a Supabase-backed table
- `/room/:roomCode` lobby, pack selection, game ready, and Judge selection
- `/game/:roomCode` handoff into the existing local M01 round UI

Gameplay after `/game/:roomCode` uses persisted room identity and canonical
session/round rows. Gameplay actions are realtime for the current prototype, but
`/demo` remains local-only for deterministic branch testing.

## Architecture Philosophy

The game engine is independent from the UI. React components render state and send
player actions, but React does not decide rules.

Backend access is isolated behind:

- `src/lib/supabase.ts`
- `src/services/playerIdentity`
- `src/services/rooms`

The UI consumes service functions and maps persisted room rows into the existing
`RoomState` shape used by onboarding components.

## Future QR Architecture

Production QR flow should be:

1. Venue or table QR opens NO FOLD entry.
2. A host creates a temporary room for that group.
3. The temporary room gets its own room code and join QR.
4. Friends join that temporary room.

A permanent restaurant QR must not represent one permanent shared game room.
Different groups scanning the same venue QR should never collide into one session.

## Future Realtime Plan

Later milestones can persist `GameState`, broadcast player actions, and reconcile
round state around the pure engine functions created in M00/M01.

## Future Rive Plan

Rive is presentation-only. It may animate phases and pressure moments later, but
it must never decide scores, winners, callers, Judge selection, outcomes, or game
phase logic.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

## Vercel Deployment

1. Import the GitHub repository `CreateWithTimi/nofold-table-time-game` into Vercel.
2. Select the **Vite** framework preset and the repository root directory.
3. Set install command to `npm ci`, build command to `npm run build`, and output
   directory to `dist`. Use Node.js 22.12+ (or a supported newer LTS).
4. Add these variables to both Production and Preview environments:
   - `VITE_SUPABASE_URL`: the hosted Supabase project HTTPS URL.
   - `VITE_SUPABASE_ANON_KEY`: the project's browser-safe anon key.
5. Apply the Supabase migrations in filename order. Existing projects only need
   their missing migrations; in particular,
   `20260923120000_m03_6_recovery_guards.sql` is required for replay/pack return.
   Confirm the migrations' realtime publication and RLS setup in that project.
6. Run `npm test` and `npm run build` before deploying. Importing the repository
   and deploying is a separate manual step; this preparation does not deploy it.
7. Redeploy after any environment-variable change: Vite embeds these values at
   build time, so changing Vercel settings does not update an existing build.

`vercel.json` supplies the SPA fallback for direct navigation/refresh at `/`,
`/create`, `/join`, `/room/:roomCode`, `/game/:roomCode`, and `/demo`.
React Router then resolves the screen. See [Vercel's Vite routing guidance](https://vercel.com/docs/frameworks/frontend/vite).

The browser connects directly to Supabase for HTTPS and
[Realtime WebSockets](https://supabase.com/docs/guides/realtime/protocol).
No Vercel function, WebSocket server, proxy, or additional websocket setting is
needed. Configure the hosted Supabase URL, not a developer machine's localhost.
Application navigation uses relative routes; no local dev server is required
after deployment.

All `VITE_*` variables are browser-visible. Never put a Supabase service-role
key, database password, or other secret in them. Keep local values in ignored
`.env`; `.env.example` contains names only. Dependency installs, build output,
Vercel local settings, and OS metadata are excluded from Git.

Normal production gameplay hides Test Navigation, M02 Controls, and realtime
debug labels. Build-time console/debugger removal strips development diagnostics.
The explicitly requested `/demo` reference harness remains accessible.

This is still the no-auth private playtest prototype. Required live migrations
and the multi-device stress checks listed in `M03_6_RELIABILITY_REPORT.md` must
be completed before treating it as validated for a real table. An unreachable
Supabase project or missing production variables will block persisted gameplay.
After deployment, smoke-test each direct URL and refresh using three separate
browser identities; a local build alone cannot verify the deployed site.
