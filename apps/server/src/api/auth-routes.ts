import type { IncomingMessage, ServerResponse } from 'node:http'
import { eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { sendActivationEmail, sendPasswordResetEmail } from '../auth/email'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../auth/jwt'
import { extractAuthPayload } from '../auth/middleware'
import { hashPassword, verifyPassword } from '../auth/password'
import { generateToken, hashToken } from '../auth/tokens'
import type * as schema from '../db/schema'
import { authTokens, players } from '../db/schema'

type Db = PostgresJsDatabase<typeof schema>

// In-memory store for raw tokens (test mode only)
export const rawTokenStore = new Map<string, string>()

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

function isValidEmail(email: string): boolean {
  return email.includes('@') && email.includes('.') && email.length <= 255
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/

function isValidUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 50 && USERNAME_REGEX.test(username)
}

async function handleRegister(req: IncomingMessage, res: ServerResponse, db: Db): Promise<void> {
  const body = await readBody(req)
  let parsed: { email?: string; username?: string; password?: string }
  try {
    parsed = JSON.parse(body)
  } catch {
    errorResponse(res, 400, 'Invalid JSON', 'VALIDATION_ERROR')
    return
  }

  const email = parsed.email?.trim()
  const username = parsed.username?.trim()
  const password = parsed.password

  if (!email || !isValidEmail(email)) {
    errorResponse(res, 400, 'Valid email is required', 'VALIDATION_ERROR')
    return
  }

  if (!password || password.length < 8) {
    errorResponse(res, 400, 'Password must be at least 8 characters', 'VALIDATION_ERROR')
    return
  }

  if (!username || !isValidUsername(username)) {
    errorResponse(
      res,
      400,
      'Username must be 3-50 characters (letters, numbers, underscores, hyphens)',
      'VALIDATION_ERROR',
    )
    return
  }

  // Check email uniqueness
  const existingEmail = await db.select().from(players).where(eq(players.email, email)).limit(1)
  if (existingEmail.length > 0) {
    errorResponse(res, 409, 'Email already registered', 'DUPLICATE_EMAIL')
    return
  }

  // Check username uniqueness
  const existingUsername = await db
    .select()
    .from(players)
    .where(eq(players.displayName, username))
    .limit(1)
  if (existingUsername.length > 0) {
    errorResponse(res, 409, 'Username already taken', 'DUPLICATE_USERNAME')
    return
  }

  const hashed = await hashPassword(password)

  const [created] = await db
    .insert(players)
    .values({
      displayName: username,
      email,
      passwordHash: hashed,
      isActivated: false,
    })
    .returning()

  // Generate activation token
  const { raw, hash } = generateToken()
  await db.insert(authTokens).values({
    playerId: created.id,
    tokenHash: hash,
    type: 'activation',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  // Store raw token for test endpoint
  rawTokenStore.set(`${email}:activation`, raw)

  // Send email (fire and forget)
  sendActivationEmail(email, username, raw).catch(() => {})

  json(res, 201, {
    message: 'Registration successful. Check your email to activate your account.',
  })
}

async function handleActivate(req: IncomingMessage, res: ServerResponse, db: Db): Promise<void> {
  const body = await readBody(req)
  let parsed: { token?: string }
  try {
    parsed = JSON.parse(body)
  } catch {
    errorResponse(res, 400, 'Invalid JSON', 'VALIDATION_ERROR')
    return
  }

  const rawToken = parsed.token
  if (!rawToken) {
    errorResponse(res, 400, 'Invalid or expired activation link', 'INVALID_TOKEN')
    return
  }

  const tokenHash = hashToken(rawToken)

  const rows = await db
    .select()
    .from(authTokens)
    .where(eq(authTokens.tokenHash, tokenHash))
    .limit(1)

  if (rows.length === 0) {
    errorResponse(res, 400, 'Invalid or expired activation link', 'INVALID_TOKEN')
    return
  }

  const tokenRow = rows[0]
  if (tokenRow.type !== 'activation' || tokenRow.usedAt || tokenRow.expiresAt < new Date()) {
    errorResponse(res, 400, 'Invalid or expired activation link', 'INVALID_TOKEN')
    return
  }

  // Mark token as used
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, tokenRow.id))

  // Activate player
  await db.update(players).set({ isActivated: true }).where(eq(players.id, tokenRow.playerId))

  json(res, 200, { message: 'Account activated successfully' })
}

async function handleLogin(req: IncomingMessage, res: ServerResponse, db: Db): Promise<void> {
  const body = await readBody(req)
  let parsed: { username?: string; password?: string }
  try {
    parsed = JSON.parse(body)
  } catch {
    errorResponse(res, 400, 'Invalid JSON', 'VALIDATION_ERROR')
    return
  }

  const username = parsed.username?.trim()
  const password = parsed.password

  if (!username || !password) {
    errorResponse(res, 401, 'Invalid username or password', 'INVALID_CREDENTIALS')
    return
  }

  const rows = await db.select().from(players).where(eq(players.displayName, username)).limit(1)

  if (rows.length === 0 || !rows[0].passwordHash) {
    errorResponse(res, 401, 'Invalid username or password', 'INVALID_CREDENTIALS')
    return
  }

  const player = rows[0]
  const valid = await verifyPassword(password, player.passwordHash as string)
  if (!valid) {
    errorResponse(res, 401, 'Invalid username or password', 'INVALID_CREDENTIALS')
    return
  }

  if (!player.isActivated) {
    errorResponse(
      res,
      403,
      'Please activate your account first. Check your email for the activation link.',
      'ACCOUNT_NOT_ACTIVATED',
    )
    return
  }

  const accessToken = await signAccessToken({ sub: player.id, username: player.displayName })
  const refreshToken = await signRefreshToken({ sub: player.id })

  json(res, 200, {
    accessToken,
    refreshToken,
    user: {
      id: player.id,
      username: player.displayName,
      email: player.email,
    },
  })
}

async function handleRefresh(req: IncomingMessage, res: ServerResponse, db: Db): Promise<void> {
  const body = await readBody(req)
  let parsed: { refreshToken?: string }
  try {
    parsed = JSON.parse(body)
  } catch {
    errorResponse(res, 401, 'Invalid or expired refresh token', 'INVALID_TOKEN')
    return
  }

  if (!parsed.refreshToken) {
    errorResponse(res, 401, 'Invalid or expired refresh token', 'INVALID_TOKEN')
    return
  }

  let payload: { sub: string }
  try {
    payload = await verifyRefreshToken(parsed.refreshToken)
  } catch {
    errorResponse(res, 401, 'Invalid or expired refresh token', 'INVALID_TOKEN')
    return
  }

  const rows = await db.select().from(players).where(eq(players.id, payload.sub)).limit(1)

  if (rows.length === 0) {
    errorResponse(res, 401, 'Invalid or expired refresh token', 'INVALID_TOKEN')
    return
  }

  const player = rows[0]
  const accessToken = await signAccessToken({ sub: player.id, username: player.displayName })
  const refreshToken = await signRefreshToken({ sub: player.id })

  json(res, 200, { accessToken, refreshToken })
}

async function handleForgotPassword(
  req: IncomingMessage,
  res: ServerResponse,
  db: Db,
): Promise<void> {
  const body = await readBody(req)
  let parsed: { email?: string }
  try {
    parsed = JSON.parse(body)
  } catch {
    json(res, 200, {
      message: "If that email is registered, we've sent a password reset link.",
    })
    return
  }

  const email = parsed.email?.trim()

  // Always return 200
  const successMsg = "If that email is registered, we've sent a password reset link."

  if (!email) {
    json(res, 200, { message: successMsg })
    return
  }

  const rows = await db.select().from(players).where(eq(players.email, email)).limit(1)

  if (rows.length === 0) {
    json(res, 200, { message: successMsg })
    return
  }

  const player = rows[0]
  const { raw, hash } = generateToken()
  await db.insert(authTokens).values({
    playerId: player.id,
    tokenHash: hash,
    type: 'password_reset',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  })

  rawTokenStore.set(`${email}:password_reset`, raw)

  sendPasswordResetEmail(email, player.displayName, raw).catch(() => {})

  json(res, 200, { message: successMsg })
}

async function handleResetPassword(
  req: IncomingMessage,
  res: ServerResponse,
  db: Db,
): Promise<void> {
  const body = await readBody(req)
  let parsed: { token?: string; password?: string }
  try {
    parsed = JSON.parse(body)
  } catch {
    errorResponse(res, 400, 'Invalid JSON', 'VALIDATION_ERROR')
    return
  }

  if (!parsed.password || parsed.password.length < 8) {
    errorResponse(res, 400, 'Password must be at least 8 characters', 'VALIDATION_ERROR')
    return
  }

  if (!parsed.token) {
    errorResponse(res, 400, 'Invalid or expired reset link', 'INVALID_TOKEN')
    return
  }

  const tokenHash = hashToken(parsed.token)
  const rows = await db
    .select()
    .from(authTokens)
    .where(eq(authTokens.tokenHash, tokenHash))
    .limit(1)

  if (rows.length === 0) {
    errorResponse(res, 400, 'Invalid or expired reset link', 'INVALID_TOKEN')
    return
  }

  const tokenRow = rows[0]
  if (tokenRow.type !== 'password_reset' || tokenRow.usedAt || tokenRow.expiresAt < new Date()) {
    errorResponse(res, 400, 'Invalid or expired reset link', 'INVALID_TOKEN')
    return
  }

  const hashed = await hashPassword(parsed.password)

  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, tokenRow.id))
  await db.update(players).set({ passwordHash: hashed }).where(eq(players.id, tokenRow.playerId))

  json(res, 200, { message: 'Password has been reset successfully' })
}

async function handleMe(req: IncomingMessage, res: ServerResponse, db: Db): Promise<void> {
  const payload = await extractAuthPayload(req)
  if (!payload) {
    errorResponse(res, 401, 'Unauthorized', 'UNAUTHORIZED')
    return
  }

  const rows = await db.select().from(players).where(eq(players.id, payload.sub)).limit(1)

  if (rows.length === 0) {
    errorResponse(res, 401, 'Unauthorized', 'UNAUTHORIZED')
    return
  }

  const player = rows[0]
  json(res, 200, {
    id: player.id,
    username: player.displayName,
    email: player.email,
  })
}

export async function handleAuthRequest(
  req: IncomingMessage,
  res: ServerResponse,
  db: Db,
): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const pathname = url.pathname

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    await handleRegister(req, res, db)
    return true
  }
  if (pathname === '/api/auth/activate' && req.method === 'POST') {
    await handleActivate(req, res, db)
    return true
  }
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    await handleLogin(req, res, db)
    return true
  }
  if (pathname === '/api/auth/refresh' && req.method === 'POST') {
    await handleRefresh(req, res, db)
    return true
  }
  if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
    await handleForgotPassword(req, res, db)
    return true
  }
  if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
    await handleResetPassword(req, res, db)
    return true
  }
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    await handleMe(req, res, db)
    return true
  }

  return false
}

export async function handleTestRequest(
  req: IncomingMessage,
  res: ServerResponse,
  _db: Db,
): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const pathname = url.pathname

  if (pathname === '/api/test/activation-token' && req.method === 'GET') {
    const email = url.searchParams.get('email')
    if (!email) {
      errorResponse(res, 400, 'Email required', 'VALIDATION_ERROR')
      return true
    }
    const raw = rawTokenStore.get(`${email}:activation`)
    if (!raw) {
      errorResponse(res, 404, 'No activation token found', 'NOT_FOUND')
      return true
    }
    json(res, 200, { token: raw })
    return true
  }

  if (pathname === '/api/test/reset-token' && req.method === 'GET') {
    const email = url.searchParams.get('email')
    if (!email) {
      errorResponse(res, 400, 'Email required', 'VALIDATION_ERROR')
      return true
    }
    const raw = rawTokenStore.get(`${email}:password_reset`)
    if (!raw) {
      errorResponse(res, 404, 'No reset token found', 'NOT_FOUND')
      return true
    }
    json(res, 200, { token: raw })
    return true
  }

  return false
}
