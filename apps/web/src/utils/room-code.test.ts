import { describe, expect, it } from 'vitest'
import { generateRoomCode } from './room-code'

describe('generateRoomCode', () => {
  it('returns a 6-character string', () => {
    const code = generateRoomCode()
    expect(code).toHaveLength(6)
  })

  it('contains only alphanumeric characters', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode()
      expect(code).toMatch(/^[A-Z0-9]+$/)
    }
  })

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()))
    expect(codes.size).toBeGreaterThan(90)
  })
})
