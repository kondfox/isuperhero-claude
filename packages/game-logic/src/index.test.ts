import { describe, expect, it } from 'vitest'
import {
  ALL_ABILITIES,
  applyTaskRewards,
  checkWinCondition,
  createGameEvent,
  createGameState,
  createPlayer,
  createTurn,
  drawCard,
  increaseAbility,
  isActivePlayer,
  MAX_ABILITY_SCORE,
  resolveBattle,
  rollDie,
  shuffleDeck,
} from './index'

describe('game-logic public API', () => {
  it('exports constants', () => {
    expect(MAX_ABILITY_SCORE).toBe(5)
    expect(ALL_ABILITIES).toHaveLength(5)
  })

  it('exports create-game functions', () => {
    expect(typeof createGameState).toBe('function')
    expect(typeof createPlayer).toBe('function')
  })

  it('exports dice functions', () => {
    expect(typeof rollDie).toBe('function')
  })

  it('exports battle functions', () => {
    expect(typeof resolveBattle).toBe('function')
  })

  it('exports cosmos functions', () => {
    expect(typeof drawCard).toBe('function')
    expect(typeof shuffleDeck).toBe('function')
  })

  it('exports win condition functions', () => {
    expect(typeof checkWinCondition).toBe('function')
  })

  it('exports turn functions', () => {
    expect(typeof createTurn).toBe('function')
  })

  it('exports validator functions', () => {
    expect(typeof isActivePlayer).toBe('function')
  })

  it('exports event log functions', () => {
    expect(typeof createGameEvent).toBe('function')
  })

  it('exports ability functions', () => {
    expect(typeof increaseAbility).toBe('function')
    expect(typeof applyTaskRewards).toBe('function')
  })
})
