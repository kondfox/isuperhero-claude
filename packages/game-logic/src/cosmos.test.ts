import {
  AbilityName,
  type BonusCard,
  CardType,
  type GameState,
  type MonsterCard,
} from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { drawCard, getCardType, isMonsterCard, reshuffleDeck, shuffleDeck } from './cosmos'
import { createGameState } from './create-game'

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
    expect(result?.card).toBe(monster)
    expect(result?.cardType).toBe(CardType.Monster)
    expect(result?.remainingDeck).toEqual([bonus])
  })

  it('returns null for an empty deck', () => {
    expect(drawCard([])).toBeNull()
  })

  it('returns a single card when deck has one card', () => {
    const result = drawCard([bonus])
    expect(result?.card).toBe(bonus)
    expect(result?.cardType).toBe(CardType.Bonus)
    expect(result?.remainingDeck).toEqual([])
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

const defaultSettings = {
  maxPlayers: 2,
  taskTimeLimitSeconds: 60,
  roomName: 'Test',
  roomCode: 'ABC123',
}

const bonus2: BonusCard = {
  id: 'b2',
  name: 'Shield',
  description: 'Prevents ability loss',
  effectType: 'shield',
  imageUrl: 'shield.png',
}

describe('reshuffleDeck', () => {
  it('moves discard pile into cosmos deck', () => {
    const state: GameState = {
      ...createGameState(defaultSettings),
      cosmosDeck: [],
      discardPile: [monster, bonus],
    }
    const result = reshuffleDeck(state)
    expect(result.cosmosDeck).toHaveLength(2)
    expect(result.discardPile).toEqual([])
  })

  it('preserves all cards from discard pile', () => {
    const state: GameState = {
      ...createGameState(defaultSettings),
      cosmosDeck: [],
      discardPile: [monster, bonus, bonus2],
    }
    const result = reshuffleDeck(state)
    expect(result.cosmosDeck).toHaveLength(3)
    const ids = result.cosmosDeck.map((c) => c.id).sort()
    expect(ids).toEqual(['b1', 'b2', 'm1'])
  })

  it('returns state unchanged when discard pile is empty', () => {
    const state: GameState = {
      ...createGameState(defaultSettings),
      cosmosDeck: [],
      discardPile: [],
    }
    const result = reshuffleDeck(state)
    expect(result.cosmosDeck).toEqual([])
    expect(result.discardPile).toEqual([])
  })

  it('does not mutate original state', () => {
    const discardPile = [monster, bonus]
    const state: GameState = {
      ...createGameState(defaultSettings),
      cosmosDeck: [],
      discardPile,
    }
    reshuffleDeck(state)
    expect(state.discardPile).toHaveLength(2)
    expect(state.cosmosDeck).toHaveLength(0)
  })
})
