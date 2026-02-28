# iSuperhero Online — User Flow & Screen Design

## Key Adaptation Decisions

| Physical game | Online version |
|---|---|
| 250+ physical/cognitive tasks | Two types: **digital** (in-browser) and **non-digital** (perform on camera) |
| Players verify each other at the table | Camera + mic always on; active player's feed is large for easy verification |
| Reflection mechanic on defeat | Removed — lose 1 ability point always |
| Single table play | Two modes: kids play freely OR parent-supervised session |
| Paper passport | Digital passport with animated ability bars |
| Physical cards | Animated card deck with flip/reveal effects |
| SuperGame memory mini-game | **Deferred post-MVP** |
| Guest / drop-in play | No guest mode — account required |
| No time pressure | Configurable task time limit set at room creation |
| Re-roll on duplicate task | **Auto-dedup**: server tracks rolled numbers per ability per session, auto-rerolls |
| Only active player sees their task | **Full visibility**: all players see every die roll, task, card draw, and battle |
| Pause by leaving table | Server-side game state persistence, rejoin anytime |
| Original artwork | Partial assets available — supplement with placeholder/AI art |
| Task library | All 250+ tasks ported (data entry required) |

---

## Screen Map

```
Landing Page
  └── Sign Up / Sign In
        └── Main Menu
              ├── Play
              │     ├── Create Room → Lobby (camera/mic) → Game Board
              │     └── Join Room  → Lobby (camera/mic) → Game Board
              ├── My Profile (stats, avatar, game history)
              ├── How to Play (interactive tutorial)
              ├── Settings
              └── [Parent only] Dashboard
                    ├── Child Accounts
                    └── Progress Reports
```

---

## Screen-by-Screen Flow

### 1. Landing Page

Simple, colorful, cosmic-themed. Aimed at both kids and parents.

- Hero illustration of the superhero characters
- **"Sign Up / Sign In"** → account flow (required to play)
- **"How to Play"** → animated rules explainer
- Language toggle (Russian / English)

---

### 2. Authentication

**Two account types:**

| | Parent Account | Child Account |
|---|---|---|
| Created by | Self-registration | Parent creates from dashboard |
| Capabilities | Full access, create supervised rooms, view reports | Play games, customize avatar |
| Auth | Email + password | Username + PIN (no email needed) |

- Parents can link multiple child accounts
- Kids can also self-register (age-gated: if under 13, requires parent email for approval)
- No guest play — account required for all players

---

### 3. Main Menu

Visual: cosmic hub / space station. Each menu item is a clickable zone on the illustration.

- **Play** → opens room creation/join panel
- **My Profile** → passport view, avatar customization, stats
- **How to Play** → interactive tutorial
- **Settings** → audio, language, accessibility
- **[Parent badge]** Dashboard → child management, progress reports

---

### 4. Lobby / Room

**Create Room:**
- Room name (auto-generated fun name, editable)
- Game mode: **Free Play** or **Supervised** (parent-hosted)
- Max players: 2–4
- **Task time limit**: Host sets seconds-per-task (e.g. 60s, 90s, 120s, or unlimited)
- Share: 6-character room code + copy link

**Join Room:**
- Enter room code or scan QR

**In Lobby — Camera & Mic Setup:**
- On entering the lobby, each player is prompted to **grant camera and mic permissions**
- All players' video feeds are visible in the lobby (video call style grid)
- Each player selects their **difficulty level** (1/2/3) independently
- Simple emoji reactions (no free-text chat — child safety)
- "Ready" toggle — camera + mic must be active to mark ready
- Host clicks **"Start Game"** when all ready

Camera and mic stay connected for the entire game session. This enables real-time verification of non-digital tasks and creates a social "sitting at the same table" experience.

---

### 5. Game Board (Main Game Screen)

The central screen during gameplay. Cosmic-themed board with interactive elements.

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌──────────────────────┐   ┌──────┐ ┌──────┐ ┌──────┐│
│  │                      │   │ P2   │ │ P3   │ │ P4   ││
│  │   ACTIVE PLAYER      │   │ cam  │ │ cam  │ │ cam  ││
│  │   CAMERA (large)     │   │(sml) │ │(sml) │ │(sml) ││
│  │                      │   └──────┘ └──────┘ └──────┘│
│  └──────────────────────┘                              │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  GAME AREA                                      │   │
│  │                                                 │   │
│  │  [P1 passport] [P2 passport] [P3] [P4]         │   │
│  │                                                 │   │
│  │  [COSMOS DECK]   [Active player's action zone]  │   │
│  │                  [Develop Ability] [Draw Cosmos] │   │
│  │                                                 │   │
│  │  [My Bonus Cards]     [My Ship: ☐ ☐ ☐ beds]    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  [EVENT LOG: "Alex rolled 14 on Orientation"]          │
└────────────────────────────────────────────────────────┘
```

**Key layout principles:**
- **Active player's camera** is always the largest video feed — lets everyone verify task completion naturally
- **Other players' cameras** are small thumbnails — social presence without dominating the screen
- **All game events are visible to everyone**: die rolls, task text, card draws, battle results. Displayed in the game area AND summarized in the event log at the bottom.

**Elements:**
- **Compact passports**: Show 5 ability bars (0–5) and player name. Tap to expand. Active player's passport has glowing border.
- **Cosmos deck**: Animated card back, tap/click to draw (on your turn).
- **Action buttons**: Two choices on your turn — "Develop SuperAbility" or "Draw from Cosmos"
- **Bonus card tray**: Your collected bonus cards, tap to use
- **Ship beds**: Three slots showing tamed monsters (or empty)
- **Event log**: Running feed of game events visible to all ("Alex chose Orientation", "Alex rolled 14", "Alex is completing task: Balance on one foot...")
- **Task time limit**: Countdown bar when a task is active (configured at room creation)

---

### 6. Action: Develop SuperAbility

**Step 6a — Choose Ability:**
- Modal with 5 large icons representing each SuperAbility
- Shows current level for each (e.g., "Orientation: 2/5")
- Tap one to select

**Step 6b — Roll the Die:**
- 20-sided die animation (tap to roll or auto-roll)
- Result: task number — **visible to all players** in the game area and event log
- **Dedup logic**: The server tracks which task numbers have been rolled per SuperAbility per game session. If the roll would repeat a previously used number for that ability, the server automatically re-rolls until a unique number is found. (If all 20 are exhausted for that ability, wrap around.)

**Step 6c — Complete the Task:**
- Task card appears **on ALL players' screens** — everyone reads the same task description
- Shows: task title, instructions, difficulty badge, category icon
- **Task time limit countdown** starts (configured at room creation)
- Two task types:
  - **Digital**: Interactive in-browser activity (drawing canvas, drag-and-drop, tapping, typing, pattern matching). Active player interacts; others watch via screen share or see progress.
  - **Non-digital**: Physical/verbal activity (balance, draw on paper, speak aloud, use objects). Active player performs on camera — their large video feed lets everyone watch and verify.
- **"Done" button** when finished
  - In free mode: honor system (self-report)
  - In supervised mode: host approves/denies
- If time runs out: task counts as failed (no ability points gained, but no penalty either)

**Step 6d — Success:**
- Celebration micro-animation
- +1 on the chosen ability bar (animated fill)
- +1 on a second related ability (system auto-selects based on task category, or player chooses)
- Passport updates visible to all players in real-time

---

### 7. Action: Draw from Cosmos

Card flip animation reveals one of two outcomes — **visible to all players**:

#### 7a. Bonus Card

- Card art + effect text displayed **on all screens**
- Event log: "[Player] drew Bonus Card: [name]"
- Card slides into the drawing player's bonus card tray

#### 7b. Monster Card (Battle!)

**Visible to all players simultaneously:**

1. **Monster reveal**: Card flips with dramatic animation, showing monster art + its 5 ability scores on all screens
2. **Comparison view**: Side-by-side bars — active player's scores vs. monster's scores for each ability
3. **Resolution**: Each ability lights up green (player is strictly higher) or red (monster wins or tie)
4. **Outcome**:
   - **All 5 green → Victory**: Monster tamed, placed in ship bed. Celebration animation.
   - **Any red → Defeat**: Active player chooses which ability to lose 1 point from (tap to select). No reflection mechanic.

*(SuperGame memory mini-game is deferred post-MVP)*

---

### 8. Bonus Card Usage

- Tap any card in your tray to see its effect
- "Use Now" button activates it
- Effects happen immediately with visual feedback
- Some cards may be playable during other players' turns → push notification: "Player X is using a bonus card!"
- Used cards are discarded (removed from tray with fade animation)

---

### 9. Passport / Profile View (Expandable)

- Tap any player's compact passport to see full details
- **Full view shows:**
  - Avatar + player name
  - 5 ability bars with numeric values
  - Collected monsters (with art)
  - Bonus cards in hand
  - Ship with 3 beds (filled or empty)
  - Game stats: turns taken, tasks completed, battles won/lost

---

### 10. Win Screen

Triggers when a player fills all 3 monster beds.

- Full-screen celebration: particles, confetti, space-themed
- Winner's superhero passport displayed prominently
- Final scoreboard: all players' ability levels, monsters tamed, tasks completed
- **Buttons:**
  - "Play Again" (same room, new game)
  - "Back to Menu"
  - "Share Result" (optional: screenshot/link)

---

### 11. Pause & Resume

- **Host can pause** at any time → all players see "Game Paused" overlay
- **Any player disconnects** → their turn is skipped until they reconnect. Other players see "[Player] disconnected. Waiting..."
- **Resume**: Players rejoin via room code or "Continue Game" from main menu
- **Game state**: Fully persisted server-side (Colyseus room state + PostgreSQL backup for long sessions)

---

### 12. Supervised Mode (Parent / Specialist)

When a parent creates a "Supervised" room:

**Extra host controls overlay:**
- See all passports expanded simultaneously
- **Approve/Deny** task completion for each player
- **Adjust difficulty** for any player mid-game
- **End game early** with summary
- **Pause/Resume** control

**Post-game report (parent dashboard):**
- Per-child: which abilities were developed, how many tasks completed, which types struggled
- Session duration
- Historical graph across multiple game sessions (track improvement over time)

---

## Navigation & State Summary

| From | To | Trigger |
|---|---|---|
| Landing | Auth | Click "Sign In/Up" |
| Auth | Main Menu | Successful login |
| Main Menu | Create Room | Click "Play" → "Create" |
| Main Menu | Join Room | Click "Play" → "Join" |
| Room Setup | Lobby | Camera/mic granted |
| Lobby | Game Board | Host clicks "Start" |
| Game Board | Task Overlay | Choose "Develop Ability" |
| Game Board | Card Reveal | Choose "Draw Cosmos" |
| Game Board | Monster Battle | Cosmos reveals Monster card |
| Game Board | Win Screen | 3rd monster tamed |
| Game Board | Pause Screen | Host pauses or player disconnects |
| Win Screen | Main Menu or Lobby | Player choice |

---

## Real-Time Requirements (Colyseus + WebRTC)

| Event | Latency requirement | Notes |
|---|---|---|
| Turn transitions | < 500ms | Passport updates broadcast to all |
| Die roll / card draw | < 300ms | Must appear on all screens near-simultaneously |
| Task display | < 300ms | All players see the same task text at once |
| Video streams | WebRTC P2P | Active player camera = large, others = thumbnail |
| Bonus card interrupts | < 500ms | Can happen on any player's turn |
| Ability bar updates | < 500ms | Visible to all players after task completion |
| Disconnect detection | < 5s | Skip disconnected player's turn |

---

## Data Model Highlights

- **Tasks table**: 250+ rows, keyed by (ability, difficulty, number). Columns: title, instructions, type (digital | non-digital), media_url
- **Rolled tasks tracker**: Per game session, per ability — set of already-rolled task numbers (for dedup logic)
- **Monster cards**: 40 rows, each with 5 ability scores + art + silhouette image
- **Bonus cards**: 40 rows, each with effect_type + description + art
- **Game sessions**: Persist full state (player abilities, deck state, turn order, monster beds)
- **Player profiles**: Account info, avatar, stats, linked parent account

---

## Implementation Phases

| Phase | Scope |
|---|---|
| 1 | Auth, lobby with camera/mic setup, video chat (WebRTC), basic game board, turn structure, ability development (digital tasks only), monster battle, full event visibility |
| 2 | Cosmos deck (bonus cards), non-digital camera tasks, task time limit |
| 3 | Supervised mode, parent dashboard, post-game reports |
| 4 | Task library content entry (all 250+ tasks), game balance testing |
| 5 | Polish: animations, sound, accessibility, mobile responsiveness |
| Future | SuperGame memory mini-game (post-MVP) |
