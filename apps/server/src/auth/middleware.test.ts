import type { IncomingMessage } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { signAccessToken } from './jwt'
import { extractAuthPayload } from './middleware'

describe('middleware', () => {
  const originalSecret = process.env.JWT_SECRET

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long'
  })

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret
  })

  function mockReq(authHeader?: string): IncomingMessage {
    return {
      headers: authHeader ? { authorization: authHeader } : {},
    } as IncomingMessage
  }

  it('returns payload for valid Bearer token', async () => {
    const token = await signAccessToken({ sub: 'user-1', username: 'alice' })
    const payload = await extractAuthPayload(mockReq(`Bearer ${token}`))
    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe('user-1')
    expect(payload?.username).toBe('alice')
  })

  it('returns null when no Authorization header', async () => {
    const payload = await extractAuthPayload(mockReq())
    expect(payload).toBeNull()
  })

  it('returns null for non-Bearer scheme', async () => {
    const payload = await extractAuthPayload(mockReq('Basic abc123'))
    expect(payload).toBeNull()
  })

  it('returns null for invalid token', async () => {
    const payload = await extractAuthPayload(mockReq('Bearer invalid.token.here'))
    expect(payload).toBeNull()
  })
})
