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

function makeBonusCard(effect: BonusEffect, id = `bonus-${effect}`): BonusCard {
  return {
    id,
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

describe('applyBonusCardEffect — specific ability boosts', () => {
  it('boostManagement increases Management by 1', () => {
    const state = makeGameWithBonus(BonusEffect.BoostManagement)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').abilities[AbilityName.Management]).toBe(3)
  })

  it('boostCommunication increases Communication by 1', () => {
    const state = makeGameWithBonus(BonusEffect.BoostCommunication)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').abilities[AbilityName.Communication]).toBe(4)
  })

  it('boostOrientation increases Orientation by 1', () => {
    const state = makeGameWithBonus(BonusEffect.BoostOrientation)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').abilities[AbilityName.Orientation]).toBe(2)
  })

  it('boostProcessing increases Processing by 1', () => {
    const state = makeGameWithBonus(BonusEffect.BoostProcessing)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').abilities[AbilityName.Processing]).toBe(5)
  })

  it('boostMovementEnergy increases MovementEnergy by 1', () => {
    const state = makeGameWithBonus(BonusEffect.BoostMovementEnergy)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').abilities[AbilityName.MovementEnergy]).toBe(1)
  })

  it('clamps at MAX_ABILITY_SCORE', () => {
    const state = makeGameWithBonus(BonusEffect.BoostProcessing)
    state.players[0] = {
      ...state.players[0],
      abilities: { ...state.players[0].abilities, [AbilityName.Processing]: MAX_ABILITY_SCORE },
    }
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').abilities[AbilityName.Processing]).toBe(MAX_ABILITY_SCORE)
  })

  it('removes the card from player hand', () => {
    const state = makeGameWithBonus(BonusEffect.BoostManagement)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').bonusCards).toHaveLength(0)
  })

  it('increments bonusCardsUsed', () => {
    const state = makeGameWithBonus(BonusEffect.BoostManagement)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').bonusCardsUsed).toBe(1)
  })
})

describe('applyBonusCardEffect — boostChoice', () => {
  it('increases chosen ability by 1', () => {
    const state = makeGameWithBonus(BonusEffect.BoostChoice)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id, {
      ability: AbilityName.Orientation,
    })
    expect(getPlayer(result, 'p1').abilities[AbilityName.Orientation]).toBe(2)
  })

  it('throws without ability param', () => {
    const state = makeGameWithBonus(BonusEffect.BoostChoice)
    const card = state.players[0].bonusCards[0]
    expect(() => applyBonusCardEffect(state, 'p1', card.id)).toThrow(
      'BoostChoice requires an ability parameter',
    )
  })

  it('clamps at MAX_ABILITY_SCORE', () => {
    const state = makeGameWithBonus(BonusEffect.BoostChoice)
    state.players[0] = {
      ...state.players[0],
      abilities: { ...state.players[0].abilities, [AbilityName.Processing]: MAX_ABILITY_SCORE },
    }
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id, {
      ability: AbilityName.Processing,
    })
    expect(getPlayer(result, 'p1').abilities[AbilityName.Processing]).toBe(MAX_ABILITY_SCORE)
  })
})

describe('applyBonusCardEffect — battleAdvantage', () => {
  it('sets hasBattleAdvantage on the player', () => {
    const state = makeGameWithBonus(BonusEffect.BattleAdvantage)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').hasBattleAdvantage).toBe(true)
  })

  it('removes the card from player hand', () => {
    const state = makeGameWithBonus(BonusEffect.BattleAdvantage)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').bonusCards).toHaveLength(0)
  })
})

describe('applyBonusCardEffect — defeatImmunity', () => {
  it('sets hasDefeatImmunity on the player', () => {
    const state = makeGameWithBonus(BonusEffect.DefeatImmunity)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').hasDefeatImmunity).toBe(true)
  })
})

describe('applyBonusCardEffect — defeatImmunityChain', () => {
  it('sets hasDefeatImmunity on the player', () => {
    const state = makeGameWithBonus(BonusEffect.DefeatImmunityChain)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    expect(getPlayer(result, 'p1').hasDefeatImmunity).toBe(true)
  })
})

describe('applyBonusCardEffect — extraTurn', () => {
  it('removes the card and increments bonusCardsUsed', () => {
    const state = makeGameWithBonus(BonusEffect.ExtraTurn)
    const card = state.players[0].bonusCards[0]
    const result = applyBonusCardEffect(state, 'p1', card.id)
    const player = getPlayer(result, 'p1')
    expect(player.bonusCards).toHaveLength(0)
    expect(player.bonusCardsUsed).toBe(1)
  })
})

describe('applyBonusCardEffect — duplicate card IDs', () => {
  it('removes only one copy when player has two cards with the same ID', () => {
    const card1 = makeBonusCard(BonusEffect.BoostManagement, 'bonus1')
    const card2 = makeBonusCard(BonusEffect.BoostManagement, 'bonus1')
    const player = {
      ...createPlayer('p1', 'Alice', DifficultyLevel.Level1),
      bonusCards: [card1, card2],
      ready: true,
    }
    const state: GameState = {
      ...createGameState({
        maxPlayers: 2,
        taskTimeLimitSeconds: 60,
        roomName: 'Test',
        roomCode: 'ABC123',
      }),
      phase: GamePhase.InProgress,
      players: [player],
      turnOrder: ['p1'],
      currentTurnIndex: 0,
      turn: createTurn('p1'),
    }

    const result = applyBonusCardEffect(state, 'p1', 'bonus1')
    const updatedPlayer = getPlayer(result, 'p1')
    expect(updatedPlayer.bonusCards).toHaveLength(1)
    expect(updatedPlayer.bonusCards[0].id).toBe('bonus1')
  })
})

describe('applyBonusCardEffect — errors', () => {
  it('throws when player not found', () => {
    const state = makeGameWithBonus(BonusEffect.BoostManagement)
    const card = state.players[0].bonusCards[0]
    expect(() => applyBonusCardEffect(state, 'unknown', card.id)).toThrow('Player not found')
  })

  it('throws when card not found in player hand', () => {
    const state = makeGameWithBonus(BonusEffect.BoostManagement)
    expect(() => applyBonusCardEffect(state, 'p1', 'nonexistent')).toThrow(
      'Card not found in player hand',
    )
  })

  it('throws for unknown effect type', () => {
    const state = makeGameWithBonus(BonusEffect.BoostManagement)
    state.players[0] = {
      ...state.players[0],
      bonusCards: [{ ...state.players[0].bonusCards[0], effectType: 'unknown' }],
    }
    expect(() => applyBonusCardEffect(state, 'p1', state.players[0].bonusCards[0].id)).toThrow(
      'Unknown bonus effect',
    )
  })
})
