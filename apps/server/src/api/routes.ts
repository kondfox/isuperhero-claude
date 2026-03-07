import type { IncomingMessage, ServerResponse } from 'node:http'
import { count, eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../db/schema'
import { gameParticipants, gameRecords, players } from '../db/schema'
import { handleAuthRequest, handleTestRequest } from './auth-routes'

type Db = PostgresJsDatabase<typeof schema>

function json(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function errorResponse(res: ServerResponse, status: number, error: string, code: string): void {
  json(res, status, { error, code })
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

async function handleCreatePlayer(
  req: IncomingMessage,
  res: ServerResponse,
  db: Db,
): Promise<void> {
  const body = await readBody(req)
  let parsed: { displayName?: string }
  try {
    parsed = JSON.parse(body)
  } catch {
    errorResponse(res, 400, 'Invalid JSON', 'VALIDATION_ERROR')
    return
  }

  const displayName = parsed.displayName?.trim()
  if (!displayName) {
    errorResponse(res, 400, 'Display name required', 'VALIDATION_ERROR')
    return
  }

  if (displayName.length > 50) {
    errorResponse(res, 400, 'Display name too long', 'VALIDATION_ERROR')
    return
  }

  // Upsert: find existing or create
  const existing = await db
    .select()
    .from(players)
    .where(eq(players.displayName, displayName))
    .limit(1)

  if (existing.length > 0) {
    const player = existing[0]
    json(res, 200, {
      id: player.id,
      displayName: player.displayName,
      createdAt: player.createdAt?.toISOString(),
    })
    return
  }

  const [created] = await db.insert(players).values({ displayName }).returning()

  json(res, 200, {
    id: created.id,
    displayName: created.displayName,
    createdAt: created.createdAt?.toISOString(),
  })
}

async function handlePlayerHistory(res: ServerResponse, playerId: string, db: Db): Promise<void> {
  // Check player exists
  const player = await db.select().from(players).where(eq(players.id, playerId)).limit(1)

  if (player.length === 0) {
    errorResponse(res, 404, 'Player not found', 'NOT_FOUND')
    return
  }

  const rows = await db
    .select({
      gameId: gameRecords.id,
      roomCode: gameRecords.roomCode,
      startedAt: gameRecords.startedAt,
      finishedAt: gameRecords.finishedAt,
      rank: gameParticipants.finalRank,
      monstersCount: gameParticipants.monstersTamed,
      winnerId: gameRecords.winnerId,
    })
    .from(gameParticipants)
    .innerJoin(gameRecords, eq(gameParticipants.gameId, gameRecords.id))
    .where(eq(gameParticipants.playerId, playerId))

  const games = rows.map((r) => ({
    gameId: r.gameId,
    roomCode: r.roomCode,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
    rank: r.rank,
    monstersCount: r.monstersCount,
    won: r.winnerId === playerId,
  }))

  json(res, 200, { games })
}

async function handleLeaderboard(
  res: ServerResponse,
  limitParam: string | null,
  db: Db,
): Promise<void> {
  let limit = 20
  if (limitParam) {
    const parsed = Number.parseInt(limitParam, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 100)
    }
  }

  const rows = await db
    .select({
      playerId: players.id,
      displayName: players.displayName,
      gamesPlayed: count(gameParticipants.id),
      wins: sql<number>`count(distinct ${gameRecords.id}) filter (where ${gameRecords.winnerId} = ${players.id})`.as(
        'wins',
      ),
      totalMonsters: sql<number>`coalesce(sum(${gameParticipants.monstersTamed}), 0)`.as(
        'total_monsters',
      ),
      bestScore: sql<number>`coalesce(max(${gameParticipants.totalAbilityScore}), 0)`.as(
        'best_score',
      ),
    })
    .from(players)
    .leftJoin(gameParticipants, eq(gameParticipants.playerId, players.id))
    .leftJoin(gameRecords, eq(gameRecords.id, gameParticipants.gameId))
    .groupBy(players.id, players.displayName)
    .orderBy(sql`wins desc, total_monsters desc`)
    .limit(limit)

  const entries = rows.map((r) => ({
    playerId: r.playerId,
    displayName: r.displayName,
    gamesPlayed: Number(r.gamesPlayed),
    wins: Number(r.wins),
    totalMonsters: Number(r.totalMonsters),
    bestScore: Number(r.bestScore),
  }))

  json(res, 200, { entries })
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  db: Db,
): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const pathname = url.pathname

  // Auth routes
  if (pathname.startsWith('/api/auth/')) {
    return handleAuthRequest(req, res, db)
  }

  // Test routes (non-production only)
  if (pathname.startsWith('/api/test/') && process.env.NODE_ENV !== 'production') {
    return handleTestRequest(req, res, db)
  }

  // POST /api/players
  if (pathname === '/api/players' && req.method === 'POST') {
    await handleCreatePlayer(req, res, db)
    return true
  }

  // GET /api/players/:id/history
  const historyMatch = pathname.match(/^\/api\/players\/([^/]+)\/history$/)
  if (historyMatch && req.method === 'GET') {
    await handlePlayerHistory(res, historyMatch[1], db)
    return true
  }

  // GET /api/leaderboard
  if (pathname === '/api/leaderboard' && req.method === 'GET') {
    const limitParam = url.searchParams.get('limit')
    await handleLeaderboard(res, limitParam, db)
    return true
  }

  return false
}
