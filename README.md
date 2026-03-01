# iSuperhero Online

An online real-time multiplayer version of the [iSuperhero](http://isuperhero.ru/) board game — a neuropsychological game that develops cognitive and motor skills in children aged 5-13 through story-based gameplay.

## Tech Stack

- **Runtime / Package Manager**: [Bun](https://bun.sh/)
- **Frontend**: React 19 + Vite 6 + TypeScript
- **Game Server**: [Colyseus](https://colyseus.io/) 0.15 (real-time multiplayer)
- **Database**: PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- **Code Quality**: [Biome](https://biomejs.dev/) (lint + format), [Vitest](https://vitest.dev/) (unit tests), [Playwright](https://playwright.dev/) (E2E)
- **Infrastructure**: Hetzner Cloud, Terraform, Docker

## Project Structure

```
apps/
  web/             React frontend (port 5173)
  server/          Colyseus game server (port 2567)
packages/
  types/           Shared TypeScript types
  game-logic/      Pure game rules (zero IO, 100% test coverage)
  game-data/       Game content definitions (monsters, bonus cards, tasks)
infra/
  envs/stage/      Terraform — staging environment
  envs/prod/       Terraform — production environment
  modules/         Reusable Terraform modules
```

## Prerequisites

- [Bun](https://bun.sh/) (latest)
- [Docker](https://www.docker.com/) (for local PostgreSQL)
- Node.js 20+ (required by Playwright for E2E tests)

## Getting Started

```bash
# Clone and install
git clone https://github.com/kondfox/isuperhero-claude.git
cd isuperhero-claude
bun install

# Environment variables
cp .env.example .env
# Edit .env with your values (at minimum, set DATABASE_URL)

# Start local PostgreSQL (port 5433 to avoid conflicts)
docker compose up -d

# Set up the database
bun run --filter @isuperhero/server db:migrate
bun run --filter @isuperhero/server db:seed

# Start development
bun run dev
```

The web app runs at `http://localhost:5173` and the game server at `ws://localhost:2567`.

## Commands

Run from the project root:

| Command | Description |
|---|---|
| `bun run dev` | Start all apps (web + server) |
| `bun run test` | Run all unit tests (Vitest) |
| `bun run typecheck` | TypeScript check across all workspaces |
| `bun run lint:fix` | Format + lint all files (Biome) |
| `bun run build` | Build all apps for production |

### Server-specific

| Command | Description |
|---|---|
| `bun run --filter @isuperhero/server db:generate` | Generate Drizzle migrations |
| `bun run --filter @isuperhero/server db:migrate` | Apply database migrations |
| `bun run --filter @isuperhero/server db:seed` | Seed game data into the database |
| `bun run --filter @isuperhero/server db:studio` | Open Drizzle Studio (DB browser) |

## Database

### Local PostgreSQL

The project includes a `docker-compose.yml` that runs PostgreSQL 16 on port **5433** (to avoid conflicts with a local PostgreSQL on 5432):

```bash
docker compose up -d      # Start
docker compose down        # Stop
docker compose down -v     # Stop and delete data
```

The default connection string is already set in `.env.example`:

```
DATABASE_URL=postgresql://isuperhero:password@localhost:5433/isuperhero_dev
```

### Migrations

Drizzle manages schema migrations in `apps/server/drizzle/`. After changing the schema in `apps/server/src/db/schema.ts`:

```bash
bun run --filter @isuperhero/server db:generate   # Generate migration SQL
bun run --filter @isuperhero/server db:migrate     # Apply to database
```

Never edit migrations that have already been applied.

### Seeding

The seed script loads game data (tasks, monsters, bonus cards) from the `@isuperhero/game-data` package into PostgreSQL:

```bash
bun run --filter @isuperhero/server db:seed
```

Task descriptions are private content — the source file (`packages/game-data/src/tasks-data.ts`) is git-ignored and not included in the repository. In production, tasks are served from the database.

## Testing

```bash
bun run test                                    # All unit tests
bun run --filter @isuperhero/game-logic test:coverage  # Coverage report (100% required)
cd apps/web && bun run test:e2e                 # Playwright E2E tests
```

`packages/game-logic` has a **100% test coverage mandate** — all game rules are pure functions with no IO.

## Deployment

| Environment | Trigger | Server |
|---|---|---|
| **dev** | Local | `bun run dev` |
| **stage** | Auto on merge to `main` | Hetzner CX22 |
| **prod** | Manual `workflow_dispatch` | Hetzner CX22 |

CI runs on every PR: Biome lint, TypeScript check, Vitest, and Playwright E2E.

Infrastructure is managed with Terraform in `infra/`. Deployments use Docker images pushed to GitHub Container Registry (GHCR).

## Contributing

### Branches

Always work on feature branches — never commit directly to `main`.

- `feat/...` — new features
- `fix/...` — bug fixes
- `chore/...` — maintenance
- `infra/...` — infrastructure changes

### Commits

[Gitmoji](https://gitmoji.dev/) is required as the first character:

```
✨ feat: add game room creation
🐛 fix: player disconnect handling
♻️ refactor: game state schema
✅ test: add card draw mechanics
```

### Code Style

- TypeScript strict mode (`strict: true`), no `any`
- Biome handles formatting — run `bun run lint:fix` before committing
- Always use `bun`, never `npm` / `npx` / `yarn` / `pnpm`

### TDD

Write the failing test **before** the implementation. Run `bun run test` before pushing.
