import {
  AbilityName,
  type AbilityScores,
  type BonusCard,
  CardType,
  DifficultyLevel,
  GamePhase,
  type GameState,
  type MonsterCard,
  TaskType,
  TurnAction,
  TurnPhase,
  type TurnState,
} from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { createGameState, createPlayer } from './create-game'
import {
  advanceToNextPlayer,
  applyBattleDefeatPenalty,
  applyBattleOutcome,
  applyChooseAbility,
  applyChooseAction,
  applyDieRoll,
  applyDrawCard,
  applyTaskComplete,
  canEndTurn,
  createTurn,
  drawFromCosmosDeck,
} from './turn'

const defaultSettings = {
  maxPlayers: 4,
  taskTimeLimitSeconds: 60,
  roomName: 'Test',
  roomCode: 'ABC123',
}

const monsterAbilities: AbilityScores = {
  [AbilityName.Management]: 1,
  [AbilityName.Communication]: 1,
  [AbilityName.Orientation]: 1,
  [AbilityName.Processing]: 1,
  [AbilityName.MovementEnergy]: 1,
}

const testMonster: MonsterCard = {
  id: 'm1',
  name: 'Gremlin',
  abilities: monsterAbilities,
  imageUrl: 'gremlin.png',
}

const testBonus: BonusCard = {
  id: 'b1',
  name: 'Power Boost',
  description: '+1 to any ability',
  effectType: 'boost',
  imageUrl: 'boost.png',
}

const testTask = {
  id: 't1',
  abilityName: AbilityName.Management,
  taskNumber: 5,
  title: { ru: 'Тест', en: 'Test Task' },
  rewards: [AbilityName.Management, AbilityName.Processing],
  levels: {
    '1': { ru: '<p>Сделай что-нибудь</p>', en: '<p>Do something</p>' },
    '2': { ru: '<p>Сделай что-нибудь</p>', en: '<p>Do something</p>' },
    '3': { ru: '<p>Сделай что-нибудь</p>', en: '<p>Do something</p>' },
  },
  taskType: TaskType.NonDigital,
}

function getPlayer(state: GameState, id: string) {
  const player = state.players.find((p) => p.id === id)
  if (!player) throw new Error(`Player ${id} not found in test`)
  return player
}

function getTurn(state: GameState) {
  if (!state.turn) throw new Error('Turn is null in test')
  return state.turn
}

function makeGameInProgress(): GameState {
  const state = createGameState(defaultSettings)
  const p1 = { ...createPlayer('p1', 'Alice', DifficultyLevel.Level1), ready: true }
  const p2 = { ...createPlayer('p2', 'Bob', DifficultyLevel.Level2), ready: true }
  return {
    ...state,
    phase: GamePhase.InProgress,
    players: [p1, p2],
    turnOrder: ['p1', 'p2'],
    currentTurnIndex: 0,
    turn: createTurn('p1'),
  }
}

describe('createTurn', () => {
  it('creates a turn in ChoosingAction phase', () => {
    const turn = createTurn('p1')
    expect(turn.activePlayerId).toBe('p1')
    expect(turn.phase).toBe(TurnPhase.ChoosingAction)
  })
})

describe('advanceToNextPlayer', () => {
  it('moves to the next player in turn order', () => {
    const state = makeGameInProgress()
    const result = advanceToNextPlayer(state)
    expect(result.currentTurnIndex).toBe(1)
    expect(result.turn?.activePlayerId).toBe('p2')
  })

  it('wraps around to the first player', () => {
    const state = { ...makeGameInProgress(), currentTurnIndex: 1 }
    const result = advanceToNextPlayer(state)
    expect(result.currentTurnIndex).toBe(0)
    expect(result.turn?.activePlayerId).toBe('p1')
  })

  it('skips disconnected players', () => {
    const state = makeGameInProgress()
    state.players[1] = { ...state.players[1], connected: false }
    const result = advanceToNextPlayer(state)
    expect(result.turn?.activePlayerId).toBe('p1')
  })

  it('falls back when all players are disconnected', () => {
    const state = makeGameInProgress()
    state.players = state.players.map((p) => ({ ...p, connected: false }))
    const result = advanceToNextPlayer(state)
    expect(result.turn).not.toBeNull()
  })

  it('throws when turn order is empty', () => {
    const state = { ...makeGameInProgress(), turnOrder: [] }
    expect(() => advanceToNextPlayer(state)).toThrow('No players in turn order')
  })

  it('is a no-op when game phase is Finished', () => {
    const state = { ...makeGameInProgress(), phase: GamePhase.Finished }
    const result = advanceToNextPlayer(state)
    expect(result).toBe(state)
  })
})

describe('applyChooseAction — Develop Ability', () => {
  it('transitions to ChoosingAbility phase', () => {
    const state = makeGameInProgress()
    const result = applyChooseAction(state, TurnAction.DevelopAbility)
    expect(result.turn?.phase).toBe(TurnPhase.ChoosingAbility)
    expect(result.turn?.chosenAction).toBe(TurnAction.DevelopAbility)
  })

  it('throws on wrong phase', () => {
    const state = makeGameInProgress()
    state.turn = { ...getTurn(state), phase: TurnPhase.RollingDie }
    expect(() => applyChooseAction(state, TurnAction.DevelopAbility)).toThrow('Expected phase')
  })

  it('throws when turn is null', () => {
    const state = { ...makeGameInProgress(), turn: null }
    expect(() => applyChooseAction(state, TurnAction.DevelopAbility)).toThrow('got null')
  })
})

describe('applyChooseAction — Draw from Cosmos', () => {
  it('transitions to DrawingCard phase', () => {
    const state = makeGameInProgress()
    const result = applyChooseAction(state, TurnAction.DrawFromCosmos)
    expect(result.turn?.phase).toBe(TurnPhase.DrawingCard)
    expect(result.turn?.chosenAction).toBe(TurnAction.DrawFromCosmos)
  })
})

describe('applyChooseAbility', () => {
  it('transitions to RollingDie phase', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DevelopAbility)
    const result = applyChooseAbility(state, AbilityName.Orientation)
    expect(result.turn?.phase).toBe(TurnPhase.RollingDie)
    expect(result.turn?.chosenAbility).toBe(AbilityName.Orientation)
  })

  it('throws on wrong phase', () => {
    const state = makeGameInProgress()
    expect(() => applyChooseAbility(state, AbilityName.Orientation)).toThrow('Expected phase')
  })
})

describe('applyDieRoll', () => {
  it('transitions to CompletingTask with task and roll data', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DevelopAbility)
    state = applyChooseAbility(state, AbilityName.Management)

    const rollResult = { taskNumber: 5, wasRerolled: false, rerollCount: 0 }
    const result = applyDieRoll(state, rollResult, testTask)
    expect(result.turn?.phase).toBe(TurnPhase.CompletingTask)
    expect(result.turn?.dieRoll).toEqual(rollResult)
    expect(result.turn?.currentTask).toBe(testTask)
  })
})

describe('applyTaskComplete', () => {
  function stateAtCompletingTask() {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DevelopAbility)
    state = applyChooseAbility(state, AbilityName.Management)
    state = applyDieRoll(state, { taskNumber: 5, wasRerolled: false, rerollCount: 0 }, testTask)
    return state
  }

  it('auto-applies rewards and transitions to ChoosingAction on success (allows optional draw)', () => {
    const result = applyTaskComplete(stateAtCompletingTask(), true)
    expect(result.turn?.phase).toBe(TurnPhase.ChoosingAction)
    const player = getPlayer(result, 'p1')
    expect(player.abilities[AbilityName.Management]).toBe(1)
    expect(player.abilities[AbilityName.Processing]).toBe(1)
    expect(player.abilities[AbilityName.Communication]).toBe(0)
  })

  it('transitions to ChoosingAction on failure without rewards (allows optional draw)', () => {
    const result = applyTaskComplete(stateAtCompletingTask(), false)
    expect(result.turn?.phase).toBe(TurnPhase.ChoosingAction)
    const player = getPlayer(result, 'p1')
    expect(player.abilities[AbilityName.Management]).toBe(0)
    expect(player.abilities[AbilityName.Processing]).toBe(0)
  })

  it('throws when active player not found', () => {
    const state = stateAtCompletingTask()
    const broken = { ...state, players: [] }
    expect(() => applyTaskComplete(broken, true)).toThrow('Active player not found')
  })

  it('throws when no task in current turn', () => {
    const state = stateAtCompletingTask()
    const broken = {
      ...state,
      turn: { ...getTurn(state), currentTask: undefined },
    }
    expect(() => applyTaskComplete(broken, true)).toThrow('No task in current turn')
  })
})

describe('applyChooseAction — after develop (two-action turn)', () => {
  function stateAfterDevelop() {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DevelopAbility)
    state = applyChooseAbility(state, AbilityName.Management)
    state = applyDieRoll(state, { taskNumber: 5, wasRerolled: false, rerollCount: 0 }, testTask)
    state = applyTaskComplete(state, true)
    return state // ChoosingAction with currentTask set
  }

  it('allows DrawFromCosmos after developing', () => {
    const state = stateAfterDevelop()
    const result = applyChooseAction(state, TurnAction.DrawFromCosmos)
    expect(result.turn?.phase).toBe(TurnPhase.DrawingCard)
  })

  it('rejects DevelopAbility when already developed this turn', () => {
    const state = stateAfterDevelop()
    expect(() => applyChooseAction(state, TurnAction.DevelopAbility)).toThrow(
      'Already developed this turn',
    )
  })
})

describe('canEndTurn', () => {
  it('returns true when phase is TurnComplete', () => {
    const turn: TurnState = { activePlayerId: 'p1', phase: TurnPhase.TurnComplete }
    expect(canEndTurn(turn)).toBe(true)
  })

  it('returns true when phase is ChoosingAction and develop was done', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DevelopAbility)
    state = applyChooseAbility(state, AbilityName.Management)
    state = applyDieRoll(state, { taskNumber: 5, wasRerolled: false, rerollCount: 0 }, testTask)
    state = applyTaskComplete(state, true)
    expect(canEndTurn(getTurn(state))).toBe(true)
  })

  it('returns false when phase is ChoosingAction at start of turn', () => {
    const turn: TurnState = { activePlayerId: 'p1', phase: TurnPhase.ChoosingAction }
    expect(canEndTurn(turn)).toBe(false)
  })

  it('returns false when phase is CompletingTask', () => {
    const turn: TurnState = { activePlayerId: 'p1', phase: TurnPhase.CompletingTask }
    expect(canEndTurn(turn)).toBe(false)
  })
})

describe('applyDrawCard — Bonus', () => {
  it('adds bonus card to player and completes turn', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    const result = applyDrawCard(state, testBonus, CardType.Bonus)
    expect(result.turn?.phase).toBe(TurnPhase.TurnComplete)
    expect(result.turn?.drawnCard).toBe(testBonus)
    expect(result.turn?.drawnCardType).toBe(CardType.Bonus)
    const player = getPlayer(result, 'p1')
    expect(player.bonusCards).toContain(testBonus)
  })

  it('throws when active player not found', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    const broken = { ...state, players: [] }
    expect(() => applyDrawCard(broken, testBonus, CardType.Bonus)).toThrow(
      'Active player not found',
    )
  })
})

describe('applyDrawCard — Monster', () => {
  it('transitions to MonsterBattle phase', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    const result = applyDrawCard(state, testMonster, CardType.Monster)
    expect(result.turn?.phase).toBe(TurnPhase.MonsterBattle)
    expect(result.turn?.drawnCard).toBe(testMonster)
    expect(result.turn?.drawnCardType).toBe(CardType.Monster)
  })
})

describe('applyBattleOutcome — Victory', () => {
  function stateAtBattle() {
    let state = makeGameInProgress()
    state.players[0] = {
      ...state.players[0],
      abilities: {
        [AbilityName.Management]: 5,
        [AbilityName.Communication]: 5,
        [AbilityName.Orientation]: 5,
        [AbilityName.Processing]: 5,
        [AbilityName.MovementEnergy]: 5,
      },
    }
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    state = applyDrawCard(state, testMonster, CardType.Monster)
    return state
  }

  it('tames monster and completes turn on victory', () => {
    const state = stateAtBattle()
    const result = applyBattleOutcome(state, {
      victory: true,
      comparisons: {
        [AbilityName.Management]: { playerScore: 5, monsterScore: 1, playerWins: true },
        [AbilityName.Communication]: { playerScore: 5, monsterScore: 1, playerWins: true },
        [AbilityName.Orientation]: { playerScore: 5, monsterScore: 1, playerWins: true },
        [AbilityName.Processing]: { playerScore: 5, monsterScore: 1, playerWins: true },
        [AbilityName.MovementEnergy]: { playerScore: 5, monsterScore: 1, playerWins: true },
      },
    })
    expect(result.turn?.phase).toBe(TurnPhase.TurnComplete)
    const player = getPlayer(result, 'p1')
    expect(player.monstersTamed).toHaveLength(1)
  })
})

describe('applyBattleOutcome — Defeat', () => {
  function stateAtBattle() {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    state = applyDrawCard(state, testMonster, CardType.Monster)
    return state
  }

  it('transitions to BattleDefeatPenalty on defeat', () => {
    const state = stateAtBattle()
    const result = applyBattleOutcome(state, {
      victory: false,
      comparisons: {
        [AbilityName.Management]: { playerScore: 0, monsterScore: 1, playerWins: false },
        [AbilityName.Communication]: { playerScore: 0, monsterScore: 1, playerWins: false },
        [AbilityName.Orientation]: { playerScore: 0, monsterScore: 1, playerWins: false },
        [AbilityName.Processing]: { playerScore: 0, monsterScore: 1, playerWins: false },
        [AbilityName.MovementEnergy]: { playerScore: 0, monsterScore: 1, playerWins: false },
      },
    })
    expect(result.turn?.phase).toBe(TurnPhase.BattleDefeatPenalty)
  })
})

describe('applyBattleDefeatPenalty', () => {
  function stateAtPenalty() {
    let state = makeGameInProgress()
    state.players[0] = {
      ...state.players[0],
      abilities: {
        ...state.players[0].abilities,
        [AbilityName.Management]: 3,
      },
    }
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    state = applyDrawCard(state, testMonster, CardType.Monster)
    state = applyBattleOutcome(state, {
      victory: false,
      comparisons: {
        [AbilityName.Management]: { playerScore: 3, monsterScore: 1, playerWins: true },
        [AbilityName.Communication]: { playerScore: 0, monsterScore: 1, playerWins: false },
        [AbilityName.Orientation]: { playerScore: 0, monsterScore: 1, playerWins: false },
        [AbilityName.Processing]: { playerScore: 0, monsterScore: 1, playerWins: false },
        [AbilityName.MovementEnergy]: { playerScore: 0, monsterScore: 1, playerWins: false },
      },
    })
    return state
  }

  it('decreases chosen ability and completes turn', () => {
    const state = stateAtPenalty()
    const result = applyBattleDefeatPenalty(state, AbilityName.Management)
    expect(result.turn?.phase).toBe(TurnPhase.TurnComplete)
    const player = getPlayer(result, 'p1')
    expect(player.abilities[AbilityName.Management]).toBe(2)
  })

  it('throws when active player not found', () => {
    const state = stateAtPenalty()
    const broken = { ...state, players: [] }
    expect(() => applyBattleDefeatPenalty(broken, AbilityName.Management)).toThrow(
      'Active player not found',
    )
  })
})

describe('applyBattleOutcome — player not found', () => {
  it('throws when active player not found', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    state = applyDrawCard(state, testMonster, CardType.Monster)
    const broken = { ...state, players: [] }
    expect(() =>
      applyBattleOutcome(broken, {
        victory: true,
        comparisons: {
          [AbilityName.Management]: { playerScore: 5, monsterScore: 1, playerWins: true },
          [AbilityName.Communication]: {
            playerScore: 5,
            monsterScore: 1,
            playerWins: true,
          },
          [AbilityName.Orientation]: {
            playerScore: 5,
            monsterScore: 1,
            playerWins: true,
          },
          [AbilityName.Processing]: { playerScore: 5, monsterScore: 1, playerWins: true },
          [AbilityName.MovementEnergy]: {
            playerScore: 5,
            monsterScore: 1,
            playerWins: true,
          },
        },
      }),
    ).toThrow('Active player not found')
  })
})

describe('drawFromCosmosDeck', () => {
  it('draws from cosmos deck and processes the card', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    state = { ...state, cosmosDeck: [testBonus, testMonster], discardPile: [] }
    const result = drawFromCosmosDeck(state)
    expect(result.turn?.drawnCard).toEqual(testBonus)
    expect(result.cosmosDeck).toEqual([testMonster])
  })

  it('reshuffles discard pile when deck is empty', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    state = { ...state, cosmosDeck: [], discardPile: [testBonus, testMonster] }
    const result = drawFromCosmosDeck(state)
    // Should have drawn one card from reshuffled deck
    expect(result.turn?.drawnCard).toBeDefined()
    expect(result.cosmosDeck.length + result.discardPile.length).toBe(1)
  })

  it('skips draw and goes to TurnComplete when both deck and discard are empty', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    state = { ...state, cosmosDeck: [], discardPile: [] }
    const result = drawFromCosmosDeck(state)
    expect(result.turn?.phase).toBe(TurnPhase.TurnComplete)
    expect(result.turn?.drawnCard).toBeUndefined()
  })

  it('deck size after reshuffle equals discard pile size minus drawn card', () => {
    let state = makeGameInProgress()
    state = applyChooseAction(state, TurnAction.DrawFromCosmos)
    const cards = [testBonus, testMonster, { ...testBonus, id: 'b2' }]
    state = { ...state, cosmosDeck: [], discardPile: cards }
    const result = drawFromCosmosDeck(state)
    // Drew 1 card from reshuffled 3, so 2 remain in deck
    expect(result.cosmosDeck).toHaveLength(2)
  })
})
