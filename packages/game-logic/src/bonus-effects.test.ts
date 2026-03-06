import {
  AbilityName,
  type BonusCard,
  BonusEffect,
  DifficultyLevel,
  GamePhase,
  type GameState,
} from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { applyBonusCardEffect } from './bonus-effects'
import { MAX_ABILITY_SCORE } from './constants'
import { createGameState, createPlayer } from './create-game'
import { createTurn } from './turn'

function makeBonusCard(effect: BonusEffect): BonusCard {
  return {
    id: `bonus-${effect}`,
    name: `Bonus ${effect}`,
    description: `Effect: ${effect}`,
    effectType: effect,
    imageUrl: `${effect}.png`,
  }
}

function makeGameWithBonus(effect: BonusEffect): GameState {
  const card = makeBonusCard(effect)
  const player = {
    ...createPlayer('p1', 'Alice', DifficultyLevel.Level1),
    abilities: {
      [AbilityName.Management]: 2,
      [AbilityName.Communication]: 3,
      [AbilityName.Orientation]: 1,
      [AbilityName.Processing]: 4,
      [AbilityName.MovementEnergy]: 0,
    },
    bonusCards: [card],
    ready: true,
  }
  const p2 = { ...createPlayer('p2', 'Bob', DifficultyLevel.Level1), ready: true }
  return {
    ...createGameState({
      maxPlayers: 2,
      taskTimeLimitSeconds: 60,
      roomName: 'Test',
      roomCode: 'ABC123',
    }),
    phase: GamePhase.InProgress,
    players: [player, p2],
    turnOrder: ['p1', 'p2'],
    currentTurnIndex: 0,
    turn: createTurn('p1'),
  }
}

function getPlayer(state: GameState, id: string) {
  const player = state.players.find((p) => p.id === id)
  if (!player) throw new Error(`Player ${id} not found in test`)
  return player
}

describe('applyBonusCardEffect — ExtraRoll', () => {
  it('grants hasExtraRoll to the player', () => {
    const state = makeGameWithBonus(BonusEffect.ExtraRoll)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    const player = getPlayer(result, 'p1')
    expect(player.hasExtraRoll).toBe(true)
  })

  it('removes the card from player hand', () => {
    const state = makeGameWithBonus(BonusEffect.ExtraRoll)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    const player = getPlayer(result, 'p1')
    expect(player.bonusCards).toHaveLength(0)
  })

  it('increments bonusCardsUsed', () => {
    const state = makeGameWithBonus(BonusEffect.ExtraRoll)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    const player = getPlayer(result, 'p1')
    expect(player.bonusCardsUsed).toBe(1)
  })
})

describe('applyBonusCardEffect — AbilityBoost', () => {
  it('increases chosen ability by 1', () => {
    const state = makeGameWithBonus(BonusEffect.AbilityBoost)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id, {
      ability: AbilityName.Management,
    })
    const player = getPlayer(result, 'p1')
    expect(player.abilities[AbilityName.Management]).toBe(3)
  })

  it('clamps at MAX_ABILITY_SCORE', () => {
    const state = makeGameWithBonus(BonusEffect.AbilityBoost)
    state.players[0] = {
      ...state.players[0],
      abilities: { ...state.players[0].abilities, [AbilityName.Processing]: MAX_ABILITY_SCORE },
    }
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id, {
      ability: AbilityName.Processing,
    })
    const player = getPlayer(result, 'p1')
    expect(player.abilities[AbilityName.Processing]).toBe(MAX_ABILITY_SCORE)
  })

  it('throws without ability param', () => {
    const state = makeGameWithBonus(BonusEffect.AbilityBoost)
    const card = state.players[0].bonusCards[0]
    expect(() => applyBonusCardEffect(state, 'p1', card.id)).toThrow(
      'AbilityBoost requires an ability parameter',
    )
  })

  it('removes the card from player hand', () => {
    const state = makeGameWithBonus(BonusEffect.AbilityBoost)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id, {
      ability: AbilityName.Management,
    })
    const player = getPlayer(result, 'p1')
    expect(player.bonusCards).toHaveLength(0)
  })
})

describe('applyBonusCardEffect — Shield', () => {
  it('grants hasShield to the player', () => {
    const state = makeGameWithBonus(BonusEffect.Shield)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    const player = getPlayer(result, 'p1')
    expect(player.hasShield).toBe(true)
  })

  it('removes the card from player hand', () => {
    const state = makeGameWithBonus(BonusEffect.Shield)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    const player = getPlayer(result, 'p1')
    expect(player.bonusCards).toHaveLength(0)
  })
})

describe('applyBonusCardEffect — Swap', () => {
  it('swaps two ability scores', () => {
    const state = makeGameWithBonus(BonusEffect.Swap)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id, {
      swapFrom: AbilityName.Management,
      swapTo: AbilityName.Processing,
    })
    const player = getPlayer(result, 'p1')
    expect(player.abilities[AbilityName.Management]).toBe(4) // was Processing's value
    expect(player.abilities[AbilityName.Processing]).toBe(2) // was Management's value
  })

  it('throws without swapFrom and swapTo params', () => {
    const state = makeGameWithBonus(BonusEffect.Swap)
    const card = state.players[0].bonusCards[0]
    expect(() => applyBonusCardEffect(state, 'p1', card.id)).toThrow(
      'Swap requires swapFrom and swapTo parameters',
    )
  })

  it('handles swapping same ability (no change)', () => {
    const state = makeGameWithBonus(BonusEffect.Swap)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id, {
      swapFrom: AbilityName.Management,
      swapTo: AbilityName.Management,
    })
    const player = getPlayer(result, 'p1')
    expect(player.abilities[AbilityName.Management]).toBe(2)
  })

  it('removes the card from player hand', () => {
    const state = makeGameWithBonus(BonusEffect.Swap)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id, {
      swapFrom: AbilityName.Management,
      swapTo: AbilityName.Processing,
    })
    const player = getPlayer(result, 'p1')
    expect(player.bonusCards).toHaveLength(0)
  })
})

describe('applyBonusCardEffect — errors', () => {
  it('throws when player not found', () => {
    const state = makeGameWithBonus(BonusEffect.ExtraRoll)
    const card = state.players[0].bonusCards[0]
    expect(() => applyBonusCardEffect(state, 'unknown', card.id)).toThrow('Player not found')
  })

  it('throws when card not found in player hand', () => {
    const state = makeGameWithBonus(BonusEffect.ExtraRoll)
    expect(() => applyBonusCardEffect(state, 'p1', 'nonexistent')).toThrow(
      'Card not found in player hand',
    )
  })

  it('throws for unknown effect type', () => {
    const state = makeGameWithBonus(BonusEffect.ExtraRoll)
    state.players[0] = {
      ...state.players[0],
      bonusCards: [{ ...state.players[0].bonusCards[0], effectType: 'unknown' }],
    }
    expect(() => applyBonusCardEffect(state, 'p1', state.players[0].bonusCards[0].id)).toThrow(
      'Unknown bonus effect',
    )
  })
})
