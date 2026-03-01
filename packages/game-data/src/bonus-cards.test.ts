import { describe, expect, it } from 'vitest'
import { BONUS_CARDS } from './bonus-cards'

describe('BONUS_CARDS', () => {
  it('contains exactly 10 bonus cards', () => {
    expect(BONUS_CARDS).toHaveLength(10)
  })

  it('each card has a unique id', () => {
    const ids = BONUS_CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(10)
  })

  it('each card has a name and description', () => {
    for (const card of BONUS_CARDS) {
      expect(card.name).toBeTruthy()
      expect(card.description).toBeTruthy()
    }
  })

  it('each card has an effectType', () => {
    for (const card of BONUS_CARDS) {
      expect(card.effectType).toBeTruthy()
    }
  })

  it('each card has an imageUrl', () => {
    for (const card of BONUS_CARDS) {
      expect(card.imageUrl).toMatch(/\.png$/)
    }
  })

  it('first card is supergame (extra turn)', () => {
    expect(BONUS_CARDS[0].id).toBe('supergame')
    expect(BONUS_CARDS[0].effectType).toBe('extraTurn')
  })
})
