# iSuperhero Online — Next Features Build Plan

## Overview

Build the next wave of features for the iSuperhero Online multiplayer board game. The core game loop is complete and playable (211 game-logic tests, full Colyseus sync, game board UI with E2E tests). This plan covers four feature areas split across 3 agents.

## Team Structure (3 Agents)

| Agent | Name | Owns | Does NOT Touch |
|-------|------|------|----------------|
| 1 | **frontend** | `apps/web/src/` | `packages/game-logic/src/`, `apps/server/src/`, `apps/server/drizzle/` |
| 2 | **game-logic** | `packages/game-logic/src/`, `packages/types/src/` | `apps/web/`, `apps/server/` |
| 3 | **server** | `apps/server/src/`, `apps/server/drizzle/` | `apps/web/`, `packages/game-logic/src/` |

---

## Feature Area 1: Edge Case Mechanics (Agent: game-logic)

The pure game-logic package needs hardening for edge cases that currently aren't handled.

### 1.1 Ability Score Capping

**Current state**: `increaseAbility` and `decreaseAbility` in `packages/game-logic/src/ability.ts` don't enforce bounds.
**Constants**: `MAX_ABILITY_SCORE = 5`, `MIN_ABILITY_SCORE = 0` in `packages/game-logic/src/constants.ts`.

**Requirements**:
- `increaseAbility()` must clamp at `MAX_ABILITY_SCORE` (5) — never exceed
- `decreaseAbility()` must clamp at `MIN_ABILITY_SCORE` (0) — never go negative
- `applyTaskRewards()` must respect the cap for each reward applied
- Add tests proving capping behavior for all three functions

### 1.2 Cosmos Deck Exhaustion

**Current state**: `drawCard()` in `packages/game-logic/src/cosmos.ts` returns `null` when deck is empty, but `applyDrawCard` in `turn.ts` doesn't handle this gracefully.

**Requirements**:
- When cosmos deck is empty and a player chooses "Draw from Cosmos", reshuffle the discard pile into the deck
- If both deck and discard pile are empty, skip the draw and advance to `TurnComplete`
- Add a `reshuffleDeck(state: GameState): GameState` function
- Add `GameEventType.CosmosReshuffled` and `GameEventType.CosmosEmpty` to the types package
- Tests for: reshuffle trigger, empty deck + empty discard, deck size after reshuffle

### 1.3 Bonus Card Effects

**Current state**: Bonus cards are drawn and stored on the player but their `effectType` is never applied.

**Requirements**:
- Define effect types enum: `ExtraRoll`, `AbilityBoost`, `Shield`, `Swap`
- `ExtraRoll`: Player gets one die reroll per battle (consumed on use)
- `AbilityBoost`: +1 to a chosen ability (applied immediately on draw, then card discarded)
- `Shield`: Prevents one ability loss from battle defeat (consumed on use)
- `Swap`: Swap two ability scores (applied immediately, then discarded)
- Add `applyBonusCardEffect(state: GameState, playerId: PlayerId, cardId: string, params?: { ability?: AbilityName, swapFrom?: AbilityName, swapTo?: AbilityName }): GameState`
- Add `useBonusCard` message type to types package
- Tests for each effect type, including edge cases (boost at max, shield with no loss, swap identical abilities)

### 1.4 Win Condition Polish

**Current state**: `checkWinCondition` checks for 3 tamed monsters. Game phase changes to `Finished` and `winnerId` is set.

**Requirements**:
- Add `GameEventType.GameFinished` event with winner details
- Ensure `advanceToNextPlayer` is a no-op when `phase === Finished`
- Add a `getGameSummary(state: GameState): GameSummary` function returning:
  ```typescript
  interface GameSummary {
    winnerId: PlayerId
    winnerName: string
    playerRankings: Array<{
      playerId: PlayerId
      name: string
      monstersCount: number
      totalAbilityScore: number
      bonusCardsUsed: number
    }>
    totalTurns: number
    gameDuration?: number
  }
  ```
- Export `GameSummary` from `packages/types/src/index.ts`
- Tests for summary generation, rankings sorting, tie-breaking

---

## Feature Area 2: Game End / Results Screen (Agent: frontend)

### 2.1 Game Over Overlay

When `state.phase === 'Finished'` and `state.winnerId` is set, display a full-screen overlay.

**Requirements**:
- Overlay covers the game board with a semi-transparent backdrop
- Shows winner name prominently with a trophy/star visual
- Shows player rankings table (rank, name, monsters tamed, total ability score)
- Highlight the current player's row
- "Back to Lobby" button that calls `leaveRoom()` and navigates to `/`
- "Play Again" button that calls `leaveRoom()` and navigates to `/` (lobby)
- Animate in with a fade + scale transition
- Component: `apps/web/src/pages/GamePage/GameOverOverlay.tsx`
- CSS Module: `apps/web/src/pages/GamePage/GameOverOverlay.module.css`

### 2.2 Game Summary Data

**Contract with game-logic agent**: The server will sync a `GameSummary` when game phase is `Finished`. Until the server agent adds this, the frontend should derive rankings client-side from the existing `GameSnapshot`:

```typescript
// Derive from existing state
const rankings = state.players
  .map(p => ({
    playerId: p.id,
    name: p.name,
    monstersCount: p.monstersTamed.length,
    totalAbilityScore: Object.values(p.abilities).reduce((a, b) => a + b, 0),
  }))
  .sort((a, b) => b.monstersCount - a.monstersCount || b.totalAbilityScore - a.totalAbilityScore)
```

---

## Feature Area 3: UI Polish & Animations (Agent: frontend)

### 3.1 Turn Transitions

**Requirements**:
- Animate ability bar changes (CSS transition on width, 300ms ease)
- Pulse animation on the active player's passport border
- Slide-in animation for task card display
- Fade transition when turn phase changes
- Card draw animation: card slides from cosmos deck to player's hand area

### 3.2 Battle Animations

**Requirements**:
- Ability comparison bars animate sequentially (stagger 200ms per ability)
- Win/loss indicators animate in after bars settle
- Victory: brief confetti or sparkle effect (CSS-only, no heavy libraries)
- Defeat: subtle shake animation on the player's passport

### 3.3 Event Log Polish

**Requirements**:
- New events slide in from top with fade
- Auto-scroll to latest event
- Color-code events by type (green for positive, red for negative, blue for info)
- Timestamp formatting (relative: "2m ago")

### 3.4 Mobile Responsiveness

**Requirements**:
- Game board stacks vertically on screens < 768px
- Player passports collapse to a compact view (name + monster count + ability total)
- Tap to expand a passport to full view
- Action buttons fill width on mobile
- Cosmos deck and event log become collapsible panels

### 3.5 Design Tokens & Theme

**Requirements**:
- Review and extend existing CSS custom properties in `apps/web/src/styles/`
- Consistent spacing scale (4px base)
- Card components get subtle shadows and rounded corners
- Hover states on all interactive elements
- Focus-visible outlines for accessibility

---

## Feature Area 4: Player Accounts & History (Agent: server)

### 4.1 Database Schema

New Drizzle tables in `apps/server/drizzle/`:

```sql
-- Player accounts (simple, no password for now — session-based)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Game records
CREATE TABLE game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  winner_id UUID REFERENCES players(id),
  total_turns INTEGER,
  settings JSONB NOT NULL DEFAULT '{}'
);

-- Player participation in games
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES game_records(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  final_rank INTEGER,
  monsters_tamed INTEGER DEFAULT 0,
  total_ability_score INTEGER DEFAULT 0,
  bonus_cards_used INTEGER DEFAULT 0,
  UNIQUE(game_id, player_id)
);

-- Leaderboard materialized from game_participants
CREATE VIEW leaderboard AS
SELECT
  p.id AS player_id,
  p.display_name,
  COUNT(DISTINCT gp.game_id) AS games_played,
  COUNT(DISTINCT gr.id) FILTER (WHERE gr.winner_id = p.id) AS wins,
  SUM(gp.monsters_tamed) AS total_monsters,
  MAX(gp.total_ability_score) AS best_score
FROM players p
LEFT JOIN game_participants gp ON gp.player_id = p.id
LEFT JOIN game_records gr ON gr.id = gp.game_id
GROUP BY p.id, p.display_name;
```

### 4.2 Game Record API

New endpoints in `apps/server/src/`:

**POST /api/players**
- Body: `{ displayName: string }`
- Response: `{ id: string, displayName: string, createdAt: string }`
- Creates or returns existing player by display name

**GET /api/players/:id/history**
- Response: `{ games: Array<{ gameId: string, roomCode: string, startedAt: string, finishedAt: string, rank: number, monstersCount: number, won: boolean }> }`

**GET /api/leaderboard**
- Query: `?limit=20`
- Response: `{ entries: Array<{ playerId: string, displayName: string, gamesPlayed: number, wins: number, totalMonsters: number, bestScore: number }> }`

### 4.3 Game Room Integration

When a game finishes (`phase === Finished`):

1. Create a `game_records` row with room code, timestamps, winner, total turns, settings
2. Create `game_participants` rows for each player with final stats
3. This happens in `GameRoom.checkGameOver()` after setting `winnerId`

**Contract**: The game-logic agent will provide `getGameSummary(state): GameSummary` — the server agent maps this to DB inserts.

### 4.4 Leaderboard Frontend Contract

The frontend agent will need to fetch and display the leaderboard. Agreed API contract:

```
GET /api/leaderboard?limit=20

Response 200:
{
  "entries": [
    {
      "playerId": "uuid",
      "displayName": "string",
      "gamesPlayed": 5,
      "wins": 3,
      "totalMonsters": 12,
      "bestScore": 22
    }
  ]
}
```

The frontend agent should add a Leaderboard link on the HomePage that navigates to `/leaderboard`.

---

## Cross-Cutting Concerns

| Concern | Owner | Details |
|---------|-------|---------|
| New type exports | game-logic | All new types/enums go in `packages/types/src/index.ts` |
| Schema sync for GameSummary | server | Add `GameSummarySchema` to Colyseus schemas, sync in `syncToSchema` |
| Bonus card message handling | server | Add `useBonusCard` message handler in GameRoom, delegating to game-logic |
| API error shapes | server | All errors: `{ error: string, code: string }` with appropriate HTTP status |
| Client-side API calls | frontend | Use `fetch()` with base URL from env var `VITE_API_URL` (default: same origin) |
| Accessibility | frontend | All interactive elements need `aria-label`, focus-visible outlines |

---

## Contracts

### game-logic -> server Contract

The server imports and calls these game-logic functions. New functions added by this plan:

```typescript
// New exports from @isuperhero/game-logic
reshuffleDeck(state: GameState): GameState
applyBonusCardEffect(state: GameState, playerId: PlayerId, cardId: string, params?: BonusCardParams): GameState
getGameSummary(state: GameState): GameSummary

// New types from @isuperhero/types
interface GameSummary { winnerId, winnerName, playerRankings, totalTurns }
interface BonusCardParams { ability?: AbilityName, swapFrom?: AbilityName, swapTo?: AbilityName }
enum BonusEffect { ExtraRoll, AbilityBoost, Shield, Swap }
GameEventType.CosmosReshuffled
GameEventType.CosmosEmpty
GameEventType.GameFinished
GameEventType.BonusCardUsed
```

### server -> frontend Contract (Colyseus State)

The frontend reads Colyseus state via `schemaToSnapshot()`. New state additions:

```typescript
// GameSnapshot additions
interface GameSnapshot {
  // existing fields...
  gameSummary?: GameSummary  // populated when phase === 'Finished'
}
```

### server -> frontend Contract (REST API)

```
POST /api/players
  Request:  { "displayName": "string" }
  Response: { "id": "uuid", "displayName": "string", "createdAt": "iso-string" }
  Error 400: { "error": "Display name required", "code": "VALIDATION_ERROR" }

GET /api/players/:id/history
  Response: { "games": [{ "gameId": "uuid", "roomCode": "string", "startedAt": "iso", "finishedAt": "iso", "rank": 1, "monstersCount": 3, "won": true }] }
  Error 404: { "error": "Player not found", "code": "NOT_FOUND" }

GET /api/leaderboard?limit=20
  Response: { "entries": [{ "playerId": "uuid", "displayName": "string", "gamesPlayed": 5, "wins": 3, "totalMonsters": 12, "bestScore": 22 }] }
```

---

## Validation

### game-logic Agent Validation
```bash
cd packages/game-logic && bun test --coverage
# Coverage must remain at 100%
# All new functions must have tests
```

### server Agent Validation
```bash
cd apps/server && bun test
bun run typecheck
bun run db:migrate  # migrations apply cleanly
```

### frontend Agent Validation
```bash
cd apps/web && bun run typecheck
bun run build  # production build succeeds
bun run test   # component tests pass
```

### End-to-End Validation (Lead)
```bash
bun run dev                    # start all services
cd apps/web && bun run test:e2e  # existing E2E tests still pass
# Manual: play a game to completion, verify game over screen appears
# Manual: check /leaderboard page loads
bun run lint:fix               # no lint errors
bun run typecheck              # no type errors across all workspaces
```

---

## Acceptance Criteria

1. Ability scores are clamped to [0, 5] — proven by tests
2. Empty cosmos deck triggers reshuffle or skip — proven by tests
3. All 4 bonus card effects work correctly — proven by tests
4. Game over overlay displays when a player wins with rankings
5. Turn transitions, battle, and event log have smooth animations
6. Game board is usable on mobile (< 768px)
7. Game results are persisted to PostgreSQL after each game
8. Leaderboard page shows top players by wins
9. All existing E2E tests continue to pass
10. `packages/game-logic` maintains 100% test coverage
11. `bun run typecheck` passes across all workspaces
12. `bun run lint:fix` produces no errors
