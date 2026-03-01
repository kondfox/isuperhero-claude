import {
  AbilityName,
  DifficultyLevel,
  GamePhase,
  type GameState,
  TurnPhase,
} from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { createGameState, createPlayer } from './create-game'
import {
  canPlayerAct,
  isActivePlayer,
  isValidAbilityChoice,
  isValidDifficultyLevel,
  isValidPhase,
} from './validators'

function makeGameInProgress(): GameState {
  const settings = {
    maxPlayers: 4,
    taskTimeLimitSeconds: 60,
    roomName: 'Test Room',
    roomCode: 'ABC123',
  }
  const state = createGameState(settings)
  const p1 = createPlayer('p1', 'Alice', DifficultyLevel.Level1)
  const p2 = createPlayer('p2', 'Bob', DifficultyLevel.Level2)
  return {
    ...state,
    phase: GamePhase.InProgress,
    players: [
      { ...p1, ready: true },
      { ...p2, ready: true },
    ],
    turnOrder: ['p1', 'p2'],
    currentTurnIndex: 0,
    turn: {
      activePlayerId: 'p1',
      phase: TurnPhase.ChoosingAction,
    },
  }
}

describe('isActivePlayer', () => {
  it('returns true for the active player', () => {
    const state = makeGameInProgress()
    expect(isActivePlayer(state, 'p1')).toBe(true)
  })

  it('returns false for a non-active player', () => {
    const state = makeGameInProgress()
    expect(isActivePlayer(state, 'p2')).toBe(false)
  })

  it('returns false when there is no turn', () => {
    const state = makeGameInProgress()
    state.turn = null
    expect(isActivePlayer(state, 'p1')).toBe(false)
  })
})

describe('isValidPhase', () => {
  it('returns true when phase matches', () => {
    const state = makeGameInProgress()
    expect(isValidPhase(state, TurnPhase.ChoosingAction)).toBe(true)
  })

  it('returns false when phase does not match', () => {
    const state = makeGameInProgress()
    expect(isValidPhase(state, TurnPhase.RollingDie)).toBe(false)
  })

  it('returns false when there is no turn', () => {
    const state = makeGameInProgress()
    state.turn = null
    expect(isValidPhase(state, TurnPhase.ChoosingAction)).toBe(false)
  })
})

describe('canPlayerAct', () => {
  it('returns true when player is active and phase is correct', () => {
    const state = makeGameInProgress()
    expect(canPlayerAct(state, 'p1', TurnPhase.ChoosingAction)).toBe(true)
  })

  it('returns false when game is not in progress', () => {
    const state = makeGameInProgress()
    state.phase = GamePhase.WaitingForPlayers
    expect(canPlayerAct(state, 'p1', TurnPhase.ChoosingAction)).toBe(false)
  })

  it('returns false for wrong player', () => {
    const state = makeGameInProgress()
    expect(canPlayerAct(state, 'p2', TurnPhase.ChoosingAction)).toBe(false)
  })

  it('returns false for wrong phase', () => {
    const state = makeGameInProgress()
    expect(canPlayerAct(state, 'p1', TurnPhase.RollingDie)).toBe(false)
  })
})

describe('isValidAbilityChoice', () => {
  it('returns true for valid abilities', () => {
    expect(isValidAbilityChoice(AbilityName.Management)).toBe(true)
    expect(isValidAbilityChoice(AbilityName.MovementEnergy)).toBe(true)
  })

  it('returns false for invalid strings', () => {
    expect(isValidAbilityChoice('flying')).toBe(false)
    expect(isValidAbilityChoice('')).toBe(false)
  })
})

describe('isValidDifficultyLevel', () => {
  it('returns true for valid levels', () => {
    expect(isValidDifficultyLevel(1)).toBe(true)
    expect(isValidDifficultyLevel(2)).toBe(true)
    expect(isValidDifficultyLevel(3)).toBe(true)
  })

  it('returns false for invalid levels', () => {
    expect(isValidDifficultyLevel(0)).toBe(false)
    expect(isValidDifficultyLevel(4)).toBe(false)
    expect(isValidDifficultyLevel(-1)).toBe(false)
  })
})
