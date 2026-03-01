import { AbilityName, type BonusCard, CardType, type MonsterCard } from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { drawCard, getCardType, isMonsterCard, shuffleDeck } from './cosmos'

const monster: MonsterCard = {
  id: 'm1',
  name: 'Gremlin',
  abilities: {
    [AbilityName.Management]: 2,
    [AbilityName.Communication]: 2,
    [AbilityName.Orientation]: 2,
    [AbilityName.Processing]: 2,
    [AbilityName.MovementEnergy]: 2,
  },
  imageUrl: 'gremlin.png',
}

const bonus: BonusCard = {
  id: 'b1',
  name: 'Power Boost',
  description: '+1 to any ability',
  effectType: 'boost',
  imageUrl: 'boost.png',
}

describe('isMonsterCard', () => {
  it('returns true for monster cards', () => {
    expect(isMonsterCard(monster)).toBe(true)
  })

  it('returns false for bonus cards', () => {
    expect(isMonsterCard(bonus)).toBe(false)
  })
})

describe('getCardType', () => {
  it('returns Monster for monster cards', () => {
    expect(getCardType(monster)).toBe(CardType.Monster)
  })

  it('returns Bonus for bonus cards', () => {
    expect(getCardType(bonus)).toBe(CardType.Bonus)
  })
})

describe('drawCard', () => {
  it('returns the top card and remaining deck', () => {
    const deck = [monster, bonus]
    const result = drawCard(deck)
    expect(result).not.toBeNull()
    expect(result!.card).toBe(monster)
    expect(result!.cardType).toBe(CardType.Monster)
    expect(result!.remainingDeck).toEqual([bonus])
  })

  it('returns null for an empty deck', () => {
    expect(drawCard([])).toBeNull()
  })

  it('returns a single card when deck has one card', () => {
    const result = drawCard([bonus])
    expect(result!.card).toBe(bonus)
    expect(result!.cardType).toBe(CardType.Bonus)
    expect(result!.remainingDeck).toEqual([])
  })

  it('does not mutate the original deck', () => {
    const deck = [monster, bonus]
    drawCard(deck)
    expect(deck).toHaveLength(2)
  })
})

describe('shuffleDeck', () => {
  it('returns an array with the same elements', () => {
    const items = [1, 2, 3, 4, 5]
    const shuffled = shuffleDeck(items, () => 0.5)
    expect(shuffled).toHaveLength(items.length)
    expect(shuffled.sort()).toEqual(items.sort())
  })

  it('produces a different order with varying random values', () => {
    const items = [1, 2, 3, 4, 5]
    let callCount = 0
    const seeded = () => {
      callCount++
      return (callCount * 0.3) % 1
    }
    const shuffled = shuffleDeck(items, seeded)
    // With this deterministic seed, order should differ from input
    expect(shuffled).not.toEqual(items)
  })

  it('does not mutate the original array', () => {
    const items = [1, 2, 3]
    shuffleDeck(items, () => 0.1)
    expect(items).toEqual([1, 2, 3])
  })

  it('handles empty array', () => {
    expect(shuffleDeck([])).toEqual([])
  })

  it('handles single element', () => {
    expect(shuffleDeck([42])).toEqual([42])
  })
})
