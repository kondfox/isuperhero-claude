import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { handleAuthRequest, handleTestRequest, rawTokenStore } from './auth-routes'

// --- Mock helpers (same pattern as routes.test.ts) ---

function createMockReq(method: string, url: string, body?: string): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage
  req.method = method
  req.url = url
  req.headers = { host: 'localhost:2567' }

  if (body !== undefined) {
    process.nextTick(() => {
      req.emit('data', Buffer.from(body))
      req.emit('end')
    })
  }

  return req
}

function createMockReqWithAuth(
  method: string,
  url: string,
  token: string,
  body?: string,
): IncomingMessage {
  // Don't pass body to createMockReq — it uses nextTick which fires before
  // async handlers (e.g. JWT verify) finish and call readBody.
  const req = createMockReq(method, url)
  req.headers.authorization = `Bearer ${token}`
  if (body !== undefined) {
    setTimeout(() => {
      req.emit('data', Buffer.from(body))
      req.emit('end')
    }, 10)
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

type Db = Parameters<typeof handleAuthRequest>[2]

function createMockDb(overrides: Record<string, unknown> = {}) {
  const mockChain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    ...overrides,
  }
  for (const [key, val] of Object.entries(mockChain)) {
    if (typeof val === 'function' && !key.startsWith('_')) {
      const fn = val as ReturnType<typeof vi.fn>
      if (!overrides[key]) {
        fn.mockReturnValue(mockChain)
      }
    }
  }
  return mockChain as unknown as Db
}

// Set JWT_SECRET for all tests
const originalSecret = process.env.JWT_SECRET
const originalNodeEnv = process.env.NODE_ENV

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long'
  process.env.APP_URL = 'http://localhost:5173'
  delete process.env.SMTP_HOST
})

afterAll(() => {
  process.env.JWT_SECRET = originalSecret
  process.env.NODE_ENV = originalNodeEnv
})

beforeEach(() => {
  rawTokenStore.clear()
})

describe('POST /api/auth/register', () => {
  it('returns 400 for missing email', async () => {
    const req = createMockReq(
      'POST',
      '/api/auth/register',
      JSON.stringify({ username: 'alice', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(400)
    expect(parseBody(res).code).toBe('VALIDATION_ERROR')
    expect(parseBody(res).error).toBe('Valid email is required')
  })

  it('returns 400 for invalid email format', async () => {
    const req = createMockReq(
      'POST',
      '/api/auth/register',
      JSON.stringify({ email: 'notanemail', username: 'alice', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(400)
    expect(parseBody(res).error).toBe('Valid email is required')
  })

  it('returns 400 for short password', async () => {
    const req = createMockReq(
      'POST',
      '/api/auth/register',
      JSON.stringify({ email: 'a@b.c', username: 'alice', password: 'short' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(400)
    expect(parseBody(res).error).toBe('Password must be at least 8 characters')
  })

  it('returns 400 for invalid username', async () => {
    const req = createMockReq(
      'POST',
      '/api/auth/register',
      JSON.stringify({ email: 'a@b.c', username: 'a', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(400)
    expect(parseBody(res).error).toBe(
      'Username must be 3-50 characters (letters, numbers, underscores, hyphens)',
    )
  })

  it('returns 400 for username with invalid chars', async () => {
    const req = createMockReq(
      'POST',
      '/api/auth/register',
      JSON.stringify({ email: 'a@b.c', username: 'alice!@#', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(400)
    expect(parseBody(res).code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 for duplicate email', async () => {
    let selectCallCount = 0
    const db = createMockDb({
      limit: vi.fn().mockImplementation(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([{ id: 'existing', email: 'a@b.c' }])
        }
        return Promise.resolve([])
      }),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/register',
      JSON.stringify({ email: 'a@b.c', username: 'alice', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(409)
    expect(parseBody(res).code).toBe('DUPLICATE_EMAIL')
  })

  it('returns 409 for duplicate username', async () => {
    let selectCallCount = 0
    const db = createMockDb({
      limit: vi.fn().mockImplementation(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([]) // no email match
        }
        return Promise.resolve([{ id: 'existing', displayName: 'alice' }]) // username match
      }),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/register',
      JSON.stringify({ email: 'a@b.c', username: 'alice', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(409)
    expect(parseBody(res).code).toBe('DUPLICATE_USERNAME')
  })

  it('returns 201 on successful registration', async () => {
    const playerId = '123e4567-e89b-12d3-a456-426614174000'
    const db = createMockDb({
      limit: vi.fn().mockImplementation(() => {
        return Promise.resolve([]) // no duplicates
      }),
      returning: vi.fn().mockResolvedValue([
        {
          id: playerId,
          displayName: 'alice',
          email: 'alice@example.com',
          isActivated: false,
        },
      ]),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/register',
      JSON.stringify({ email: 'alice@example.com', username: 'alice', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(201)
    expect(parseBody(res).message).toBe(
      'Registration successful. Check your email to activate your account.',
    )
  })
})

describe('POST /api/auth/activate', () => {
  it('returns 400 for invalid token', async () => {
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([]),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/activate',
      JSON.stringify({ token: 'invalid-token' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(400)
    expect(parseBody(res).code).toBe('INVALID_TOKEN')
  })

  it('returns 200 on successful activation', async () => {
    const tokenRow = {
      id: 'token-id',
      playerId: 'player-id',
      type: 'activation',
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
    }
    let selectCallCount = 0
    const db = createMockDb({
      limit: vi.fn().mockImplementation(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([tokenRow])
        }
        return Promise.resolve([])
      }),
      set: vi.fn().mockReturnThis(),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/activate',
      JSON.stringify({ token: 'some-raw-token' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(200)
    expect(parseBody(res).message).toBe('Account activated successfully')
  })
})

describe('POST /api/auth/login', () => {
  it('returns 401 for non-existent user', async () => {
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([]),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/login',
      JSON.stringify({ username: 'noone', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(401)
    expect(parseBody(res).code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 401 for wrong password', async () => {
    // Need a real hash for verification
    const { hashPassword } = await import('../auth/password')
    const passwordHash = await hashPassword('correct-password')
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([
        {
          id: 'player-1',
          displayName: 'alice',
          email: 'alice@example.com',
          passwordHash,
          isActivated: true,
        },
      ]),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/login',
      JSON.stringify({ username: 'alice', password: 'wrong-password' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(401)
    expect(parseBody(res).code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 403 for unactivated account', async () => {
    const { hashPassword } = await import('../auth/password')
    const passwordHash = await hashPassword('password123')
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([
        {
          id: 'player-1',
          displayName: 'alice',
          email: 'alice@example.com',
          passwordHash,
          isActivated: false,
        },
      ]),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/login',
      JSON.stringify({ username: 'alice', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(403)
    expect(parseBody(res).code).toBe('ACCOUNT_NOT_ACTIVATED')
  })

  it('returns 200 with tokens on successful login', async () => {
    const { hashPassword } = await import('../auth/password')
    const passwordHash = await hashPassword('password123')
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([
        {
          id: 'player-1',
          displayName: 'alice',
          email: 'alice@example.com',
          passwordHash,
          isActivated: true,
        },
      ]),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/login',
      JSON.stringify({ username: 'alice', password: 'password123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(200)
    const body = parseBody(res)
    expect(body.accessToken).toBeDefined()
    expect(body.refreshToken).toBeDefined()
    expect(body.user.id).toBe('player-1')
    expect(body.user.username).toBe('alice')
    expect(body.user.email).toBe('alice@example.com')
  })
})

describe('POST /api/auth/refresh', () => {
  it('returns 401 for invalid refresh token', async () => {
    const req = createMockReq(
      'POST',
      '/api/auth/refresh',
      JSON.stringify({ refreshToken: 'invalid.token' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(401)
    expect(parseBody(res).code).toBe('INVALID_TOKEN')
  })

  it('returns 200 with new tokens on valid refresh', async () => {
    const { signRefreshToken } = await import('../auth/jwt')
    const refreshToken = await signRefreshToken({ sub: 'player-1' })
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([
        {
          id: 'player-1',
          displayName: 'alice',
          email: 'alice@example.com',
        },
      ]),
    })
    const req = createMockReq('POST', '/api/auth/refresh', JSON.stringify({ refreshToken }))
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(200)
    const body = parseBody(res)
    expect(body.accessToken).toBeDefined()
    expect(body.refreshToken).toBeDefined()
  })
})

describe('POST /api/auth/forgot-password', () => {
  it('always returns 200 even if email not found', async () => {
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([]),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/forgot-password',
      JSON.stringify({ email: 'nobody@example.com' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(200)
    expect(parseBody(res).message).toBe(
      "If that email is registered, we've sent a password reset link.",
    )
  })

  it('returns 200 and stores token when email exists', async () => {
    const db = createMockDb({
      limit: vi
        .fn()
        .mockResolvedValue([{ id: 'player-1', displayName: 'alice', email: 'alice@example.com' }]),
      returning: vi.fn().mockResolvedValue([{ id: 'token-id' }]),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/forgot-password',
      JSON.stringify({ email: 'alice@example.com' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(200)
  })
})

describe('POST /api/auth/reset-password', () => {
  it('returns 400 for short password', async () => {
    const req = createMockReq(
      'POST',
      '/api/auth/reset-password',
      JSON.stringify({ token: 'some-token', password: 'short' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(400)
    expect(parseBody(res).error).toBe('Password must be at least 8 characters')
  })

  it('returns 400 for invalid token', async () => {
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([]),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/reset-password',
      JSON.stringify({ token: 'bad-token', password: 'newpassword123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(400)
    expect(parseBody(res).code).toBe('INVALID_TOKEN')
  })

  it('returns 200 on successful reset', async () => {
    const tokenRow = {
      id: 'token-id',
      playerId: 'player-id',
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
    }
    let selectCallCount = 0
    const db = createMockDb({
      limit: vi.fn().mockImplementation(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([tokenRow])
        }
        return Promise.resolve([])
      }),
      set: vi.fn().mockReturnThis(),
    })
    const req = createMockReq(
      'POST',
      '/api/auth/reset-password',
      JSON.stringify({ token: 'raw-token', password: 'newpassword123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(200)
    expect(parseBody(res).message).toBe('Password has been reset successfully')
  })
})

describe('GET /api/auth/me', () => {
  it('returns 401 without auth header', async () => {
    const req = createMockReq('GET', '/api/auth/me')
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(401)
    expect(parseBody(res).code).toBe('UNAUTHORIZED')
  })

  it('returns 200 with user data for valid token', async () => {
    const { signAccessToken } = await import('../auth/jwt')
    const token = await signAccessToken({ sub: 'player-1', username: 'alice' })
    const db = createMockDb({
      limit: vi
        .fn()
        .mockResolvedValue([{ id: 'player-1', displayName: 'alice', email: 'alice@example.com' }]),
    })
    const req = createMockReqWithAuth('GET', '/api/auth/me', token)
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(200)
    const body = parseBody(res)
    expect(body.id).toBe('player-1')
    expect(body.username).toBe('alice')
    expect(body.email).toBe('alice@example.com')
  })
})

describe('POST /api/auth/change-password', () => {
  it('returns 401 without auth header', async () => {
    const req = createMockReq(
      'POST',
      '/api/auth/change-password',
      JSON.stringify({ currentPassword: 'old', newPassword: 'newpassword123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(401)
    expect(parseBody(res).code).toBe('UNAUTHORIZED')
  })

  it('returns 400 for missing fields', async () => {
    const { signAccessToken } = await import('../auth/jwt')
    const token = await signAccessToken({ sub: 'player-1', username: 'alice' })
    const req = createMockReqWithAuth(
      'POST',
      '/api/auth/change-password',
      token,
      JSON.stringify({ currentPassword: 'old' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(400)
    expect(parseBody(res).code).toBe('MISSING_FIELDS')
  })

  it('returns 400 for short new password', async () => {
    const { signAccessToken } = await import('../auth/jwt')
    const token = await signAccessToken({ sub: 'player-1', username: 'alice' })
    const req = createMockReqWithAuth(
      'POST',
      '/api/auth/change-password',
      token,
      JSON.stringify({ currentPassword: 'oldpassword', newPassword: 'short' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, createMockDb())
    expect(res._status).toBe(400)
    expect(parseBody(res).code).toBe('PASSWORD_TOO_SHORT')
  })

  it('returns 400 for wrong current password', async () => {
    const { signAccessToken } = await import('../auth/jwt')
    const { hashPassword } = await import('../auth/password')
    const token = await signAccessToken({ sub: 'player-1', username: 'alice' })
    const passwordHash = await hashPassword('correct-password')
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([{ id: 'player-1', displayName: 'alice', passwordHash }]),
    })
    const req = createMockReqWithAuth(
      'POST',
      '/api/auth/change-password',
      token,
      JSON.stringify({ currentPassword: 'wrong-password', newPassword: 'newpassword123' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(400)
    expect(parseBody(res).code).toBe('WRONG_PASSWORD')
    expect(parseBody(res).error).toBe('Current password is incorrect')
  })

  it('returns 200 on successful password change', async () => {
    const { signAccessToken } = await import('../auth/jwt')
    const { hashPassword } = await import('../auth/password')
    const token = await signAccessToken({ sub: 'player-1', username: 'alice' })
    const passwordHash = await hashPassword('oldpassword123')
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([{ id: 'player-1', displayName: 'alice', passwordHash }]),
      set: vi.fn().mockReturnThis(),
    })
    const req = createMockReqWithAuth(
      'POST',
      '/api/auth/change-password',
      token,
      JSON.stringify({ currentPassword: 'oldpassword123', newPassword: 'newpassword456' }),
    )
    const res = createMockRes()
    await handleAuthRequest(req, res, db)
    expect(res._status).toBe(200)
    expect(parseBody(res).message).toBe('Password changed successfully')
  })
})

describe('test endpoints', () => {
  it('GET /api/test/activation-token returns 404 when no token', async () => {
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([]),
    })
    const req = createMockReq('GET', '/api/test/activation-token?email=a@b.c')
    const res = createMockRes()
    process.env.NODE_ENV = 'development'
    await handleTestRequest(req, res, db)
    expect(res._status).toBe(404)
    expect(parseBody(res).code).toBe('NOT_FOUND')
  })

  it('GET /api/test/activation-token returns token from store', async () => {
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([{ id: 'player-1', email: 'a@b.c' }]),
    })
    rawTokenStore.set('a@b.c:activation', 'raw-hex-token')
    const req = createMockReq('GET', '/api/test/activation-token?email=a@b.c')
    const res = createMockRes()
    process.env.NODE_ENV = 'development'
    await handleTestRequest(req, res, db)
    expect(res._status).toBe(200)
    expect(parseBody(res).token).toBe('raw-hex-token')
  })

  it('GET /api/test/reset-token returns token from store', async () => {
    const db = createMockDb({
      limit: vi.fn().mockResolvedValue([{ id: 'player-1', email: 'a@b.c' }]),
    })
    rawTokenStore.set('a@b.c:password_reset', 'raw-reset-token')
    const req = createMockReq('GET', '/api/test/reset-token?email=a@b.c')
    const res = createMockRes()
    process.env.NODE_ENV = 'development'
    await handleTestRequest(req, res, db)
    expect(res._status).toBe(200)
    expect(parseBody(res).token).toBe('raw-reset-token')
  })
})

describe('unmatched auth routes', () => {
  it('returns false for unknown auth path', async () => {
    const req = createMockReq('GET', '/api/auth/unknown')
    const res = createMockRes()
    const handled = await handleAuthRequest(req, res, createMockDb())
    expect(handled).toBe(false)
  })
})
