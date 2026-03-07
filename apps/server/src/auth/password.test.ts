import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password', () => {
  it('hashPassword returns a string that is not the original', async () => {
    const hash = await hashPassword('mypassword')
    expect(typeof hash).toBe('string')
    expect(hash).not.toBe('mypassword')
    expect(hash.length).toBeGreaterThan(0)
  })

  it('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('correct-password')
    const result = await verifyPassword('correct-password', hash)
    expect(result).toBe(true)
  })

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('correct-password')
    const result = await verifyPassword('wrong-password', hash)
    expect(result).toBe(false)
  })

  it('produces different hashes for the same input (salted)', async () => {
    const hash1 = await hashPassword('same-password')
    const hash2 = await hashPassword('same-password')
    expect(hash1).not.toBe(hash2)
  })
})
