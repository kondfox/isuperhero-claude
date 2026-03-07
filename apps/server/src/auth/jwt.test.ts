import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt'

describe('jwt', () => {
  const originalSecret = process.env.JWT_SECRET

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long'
  })

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret
  })

  describe('access token', () => {
    it('signs and verifies an access token', async () => {
      const token = await signAccessToken({ sub: 'user-123', username: 'alice' })
      expect(typeof token).toBe('string')

      const payload = await verifyAccessToken(token)
      expect(payload.sub).toBe('user-123')
      expect(payload.username).toBe('alice')
      expect(payload.exp).toBeDefined()
      expect(payload.iat).toBeDefined()
    })

    it('access token expires in ~15 minutes', async () => {
      const token = await signAccessToken({ sub: 'user-123', username: 'alice' })
      const payload = await verifyAccessToken(token)
      const diff = (payload.exp as number) - (payload.iat as number)
      expect(diff).toBe(900) // 15 * 60
    })

    it('rejects a tampered token', async () => {
      const token = await signAccessToken({ sub: 'user-123', username: 'alice' })
      const tampered = `${token}x`
      await expect(verifyAccessToken(tampered)).rejects.toThrow()
    })
  })

  describe('refresh token', () => {
    it('signs and verifies a refresh token', async () => {
      const token = await signRefreshToken({ sub: 'user-456' })
      expect(typeof token).toBe('string')

      const payload = await verifyRefreshToken(token)
      expect(payload.sub).toBe('user-456')
      expect(payload.exp).toBeDefined()
    })

    it('refresh token expires in ~7 days', async () => {
      const token = await signRefreshToken({ sub: 'user-456' })
      const payload = await verifyRefreshToken(token)
      const diff = (payload.exp as number) - (payload.iat as number)
      expect(diff).toBe(7 * 24 * 60 * 60)
    })

    it('rejects a tampered refresh token', async () => {
      const token = await signRefreshToken({ sub: 'user-456' })
      await expect(verifyRefreshToken(`${token}x`)).rejects.toThrow()
    })
  })
})
