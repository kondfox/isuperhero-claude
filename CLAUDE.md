# iSuperhero Online

An online real-time multiplayer version of the iSuperhero board game.

## Stack

- **Runtime/package manager**: Bun (never use `npm`, `npx`, `yarn`, or `pnpm`)
- **Frontend**: React + Vite + TypeScript
- **Game server**: Colyseus (real-time multiplayer, Bun)
- **Database**: PostgreSQL + Drizzle ORM
- **Linting/formatting**: Biome (`bun run lint:fix` for both)
- **Testing**: Vitest (unit), Playwright (E2E via MCP)

## Commands

```bash
bun run dev          # Start all apps (web + server)
bun run test         # Run all unit/integration tests across workspaces (Vitest)
bun run lint:fix     # Format + lint all files (Biome)
bun run typecheck    # TypeScript check across all workspaces
bun run build        # Build all apps for production
```

## Rules

### Package Manager
- Always use `bun`, never `npm`/`npx`/`pnpm`/`yarn`
- Install deps: `bun add <pkg>` / `bun add -d <pkg>`

### TDD Mandate
- Write the failing test **before** the implementation
- `packages/game-logic` must maintain 100% coverage
- Run `bun run test` before marking any task complete

### Commit Messages
- **Gitmoji required** as first character: https://gitmoji.dev/
- Format: `<emoji> <type>: <description>`
- Examples:
  - `✨ feat: add game room creation`
  - `🐛 fix: player disconnect handling`
  - `♻️ refactor: game state schema`
  - `✅ test: add card draw mechanics`
  - `🏗️ build: update Terraform variables`
  - `📝 docs: update game rules reference`

### Code Style
- TypeScript strict mode everywhere (`strict: true`)
- No `any` — use `unknown` when type is uncertain
- Biome enforces formatting; never manually reformat

### Architecture
- `packages/game-logic`: pure TypeScript, zero IO, fully unit-testable
- `packages/types`: shared types imported by all apps
- `apps/server`: Colyseus rooms + schemas only — delegate logic to game-logic
- `apps/web`: React UI — no game logic here

### Colyseus Patterns
- One `Room` class per game mode in `apps/server/rooms/`
- Use `@Schema` decorators for all synchronized state
- Game state mutations only via `onMessage` handlers
- Never mutate state outside of Room lifecycle methods

### Drizzle Patterns
- All migrations in `apps/server/db/migrations/`
- Run `bun run db:migrate` to apply; never edit applied migrations
- Use `db.transaction()` for multi-table writes

### Environments
- `dev`: local only
- `stage`: auto-deploys on merge to `main` (Hetzner CX22)
- `prod`: manual `workflow_dispatch` only — promotes stage image

## Infrastructure

- Hetzner Cloud, region: Nuremberg (`nbg1`)
- Managed via Terraform in `infra/`
- Secrets via environment variables — never committed
- `HCLOUD_TOKEN` for Terraform, separate tokens per environment
