import { describe, expect, it } from 'vitest'
import { generateToken, hashToken } from './tokens'

describe('tokens', () => {
  it('generateToken returns raw and hash as hex strings', () => {
    const { raw, hash } = generateToken()
    expect(raw).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generateToken returns different tokens each call', () => {
    const t1 = generateToken()
    const t2 = generateToken()
    expect(t1.raw).not.toBe(t2.raw)
    expect(t1.hash).not.toBe(t2.hash)
  })

  it('hashToken is deterministic', () => {
    const { raw } = generateToken()
    expect(hashToken(raw)).toBe(hashToken(raw))
  })

  it('hashToken of raw matches the hash from generateToken', () => {
    const { raw, hash } = generateToken()
    expect(hashToken(raw)).toBe(hash)
  })
})
