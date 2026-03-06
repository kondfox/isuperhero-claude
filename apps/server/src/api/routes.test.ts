import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import { handleApiRequest } from './routes'

// --- Mock helpers ---

function createMockReq(method: string, url: string, body?: string): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage
  req.method = method
  req.url = url
  req.headers = { host: 'localhost:2567' }

  // Simulate body delivery after event listeners are attached
  if (body !== undefined) {
    process.nextTick(() => {
      req.emit('data', Buffer.from(body))
      req.emit('end')
    })
  }

  return req
}

function createMockRes(): ServerResponse & {
  _status: number
  _body: string
  _headers: Record<string, string>
} {
  const res = {
    _status: 0,
    _body: '',
    _headers: {} as Record<string, string>,
    writeHead(status: number, headers?: Record<string, string>) {
      res._status = status
      if (headers) Object.assign(res._headers, headers)
      return res
    },
    end(data?: string) {
      res._body = data ?? ''
      return res
    },
  } as unknown as ServerResponse & {
    _status: number
    _body: string
    _headers: Record<string, string>
  }
  return res
}

function parseBody(res: { _body: string }) {
  return JSON.parse(res._body)
}

// --- Mock DB ---

function createMockDb(overrides: Record<string, unknown> = {}) {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    ...overrides,
  }
  // Make each method return the chain for fluent API
  for (const [key, val] of Object.entries(mockChain)) {
    if (typeof val === 'function' && !key.startsWith('_')) {
      const fn = val as ReturnType<typeof vi.fn>
      // Keep explicit overrides, but default returns to chain
      if (!overrides[key]) {
        fn.mockReturnValue(mockChain)
      }
    }
  }
  return mockChain as unknown as Parameters<typeof handleApiRequest>[2]
}

describe('API routes', () => {
  describe('POST /api/players', () => {
    it('returns 400 when body is invalid JSON', async () => {
      const req = createMockReq('POST', '/api/players', 'not json')
      const res = createMockRes()
      const db = createMockDb()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(400)
      expect(parseBody(res).code).toBe('VALIDATION_ERROR')
    })

    it('returns 400 when displayName is missing', async () => {
      const req = createMockReq('POST', '/api/players', '{}')
      const res = createMockRes()
      const db = createMockDb()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(400)
      expect(parseBody(res).error).toBe('Display name required')
    })

    it('returns 400 when displayName is empty string', async () => {
      const req = createMockReq('POST', '/api/players', '{"displayName":"  "}')
      const res = createMockRes()
      const db = createMockDb()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(400)
      expect(parseBody(res).error).toBe('Display name required')
    })

    it('returns 400 when displayName is too long', async () => {
      const longName = 'a'.repeat(51)
      const req = createMockReq('POST', '/api/players', JSON.stringify({ displayName: longName }))
      const res = createMockRes()
      const db = createMockDb()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(400)
      expect(parseBody(res).error).toBe('Display name too long')
    })

    it('returns existing player on duplicate displayName', async () => {
      const existingPlayer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: 'Alice',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }
      const db = createMockDb({
        limit: vi.fn().mockResolvedValue([existingPlayer]),
      })
      const req = createMockReq('POST', '/api/players', '{"displayName":"Alice"}')
      const res = createMockRes()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(200)
      const body = parseBody(res)
      expect(body.id).toBe(existingPlayer.id)
      expect(body.displayName).toBe('Alice')
    })

    it('creates new player when not found', async () => {
      const newPlayer = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        displayName: 'Bob',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      }
      const db = createMockDb({
        limit: vi.fn().mockResolvedValue([]),
        returning: vi.fn().mockResolvedValue([newPlayer]),
      })
      const req = createMockReq('POST', '/api/players', '{"displayName":"Bob"}')
      const res = createMockRes()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(200)
      const body = parseBody(res)
      expect(body.id).toBe(newPlayer.id)
      expect(body.displayName).toBe('Bob')
    })
  })

  describe('GET /api/players/:id/history', () => {
    it('returns 404 when player not found', async () => {
      const db = createMockDb({
        limit: vi.fn().mockResolvedValue([]),
      })
      const req = createMockReq('GET', '/api/players/nonexistent/history')
      const res = createMockRes()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(404)
      expect(parseBody(res).code).toBe('NOT_FOUND')
    })

    it('returns game history for existing player', async () => {
      const playerId = '123e4567-e89b-12d3-a456-426614174000'
      // First call (player lookup) returns player, second call (history) returns games
      let limitCallCount = 0
      const db = createMockDb({
        limit: vi.fn().mockImplementation(() => {
          limitCallCount++
          if (limitCallCount === 1) {
            return Promise.resolve([{ id: playerId, displayName: 'Alice' }])
          }
          return Promise.resolve([])
        }),
      })
      // Override the second select chain (innerJoin chain) to return game rows
      // The history query doesn't use limit, so we mock the where chain
      const historyRows = [
        {
          gameId: 'game-1',
          roomCode: 'ABC',
          startedAt: new Date('2024-01-01'),
          finishedAt: new Date('2024-01-01'),
          rank: 1,
          monstersCount: 3,
          winnerId: playerId,
        },
      ]
      let selectCallCount = 0
      db.select = vi.fn().mockImplementation(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          // player lookup chain
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{ id: playerId }]),
              }),
            }),
          }
        }
        // history chain
        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(historyRows),
            }),
          }),
        }
      }) as unknown as typeof db.select
      const req = createMockReq('GET', `/api/players/${playerId}/history`)
      const res = createMockRes()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(200)
      const body = parseBody(res)
      expect(body.games).toHaveLength(1)
      expect(body.games[0].won).toBe(true)
      expect(body.games[0].roomCode).toBe('ABC')
    })
  })

  describe('GET /api/leaderboard', () => {
    it('returns leaderboard entries', async () => {
      const entries = [
        {
          playerId: 'p1',
          displayName: 'Alice',
          gamesPlayed: 5,
          wins: 3,
          totalMonsters: 12,
          bestScore: 22,
        },
      ]
      const db = createMockDb({
        limit: vi.fn().mockResolvedValue(entries),
      })
      const req = createMockReq('GET', '/api/leaderboard')
      const res = createMockRes()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(200)
      const body = parseBody(res)
      expect(body.entries).toHaveLength(1)
      expect(body.entries[0].displayName).toBe('Alice')
    })

    it('respects limit parameter', async () => {
      const db = createMockDb({
        limit: vi.fn().mockResolvedValue([]),
      })
      const req = createMockReq('GET', '/api/leaderboard?limit=5')
      const res = createMockRes()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(200)
      expect(
        (db as unknown as Record<string, ReturnType<typeof vi.fn>>).limit,
      ).toHaveBeenCalledWith(5)
    })

    it('caps limit at 100', async () => {
      const db = createMockDb({
        limit: vi.fn().mockResolvedValue([]),
      })
      const req = createMockReq('GET', '/api/leaderboard?limit=200')
      const res = createMockRes()
      await handleApiRequest(req, res, db)
      expect(res._status).toBe(200)
      expect(
        (db as unknown as Record<string, ReturnType<typeof vi.fn>>).limit,
      ).toHaveBeenCalledWith(100)
    })
  })

  describe('unmatched routes', () => {
    it('returns false for unknown API path', async () => {
      const req = createMockReq('GET', '/api/unknown')
      const res = createMockRes()
      const db = createMockDb()
      const handled = await handleApiRequest(req, res, db)
      expect(handled).toBe(false)
    })
  })
})
