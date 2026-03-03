import { createInitialAbilities } from '@isuperhero/game-logic'
import type {
  BattleResult,
  BonusCard,
  GameEvent,
  GameState,
  MonsterCard,
  PlayerState,
  RoomSettings,
  TaskDefinition,
  TurnState,
} from '@isuperhero/types'
import {
  AbilityName,
  CardType,
  DifficultyLevel,
  GameEventType,
  GamePhase,
  TaskType,
  TurnAction,
  TurnPhase,
} from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { GameStateSchema } from './schemas/index'
import { syncToSchema } from './sync'

function makeMonster(id = 'boyaka'): MonsterCard {
  return {
    id,
    name: 'Бояка',
    abilities: { ...createInitialAbilities(), management: 3, communication: 4 },
    imageUrl: `/images/monsters/${id}.png`,
  }
}

function makeBonus(id = 'supergame'): BonusCard {
  return {
    id,
    name: 'Суперигра',
    description: 'Extra turn',
    effectType: 'extraTurn',
    imageUrl: `/images/bonus/${id}.png`,
  }
}

function makeTask(): TaskDefinition {
  return {
    id: 'management-1',
    abilityName: AbilityName.Management,
    taskNumber: 1,
    title: { ru: 'Взломай код' },
    rewards: [AbilityName.Management, AbilityName.Processing],
    levels: {
      '1': { ru: '<p>Level 1</p>' },
      '2': { ru: '<p>Level 2</p>' },
      '3': { ru: '<p>Level 3</p>' },
    },
    taskType: TaskType.Digital,
  }
}

function makePlayer(id = 'p1', name = 'Alice'): PlayerState {
  return {
    id,
    name,
    difficultyLevel: DifficultyLevel.Level1,
    abilities: { ...createInitialAbilities(), management: 2 },
    monstersTamed: [makeMonster()],
    bonusCards: [makeBonus()],
    connected: true,
    ready: true,
  }
}

function makeSettings(): RoomSettings {
  return {
    maxPlayers: 4,
    taskTimeLimitSeconds: 120,
    roomName: 'Test Room',
    roomCode: 'ABC123',
  }
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: GamePhase.InProgress,
    players: [makePlayer('p1', 'Alice'), makePlayer('p2', 'Bob')],
    turnOrder: ['p1', 'p2'],
    currentTurnIndex: 0,
    turn: {
      activePlayerId: 'p1',
      phase: TurnPhase.ChoosingAction,
    },
    rolledTasks: {},
    cosmosDeck: [makeMonster('m1'), makeBonus('b1'), makeMonster('m2')],
    discardPile: [],
    eventLog: [],
    winnerId: null,
    roomSettings: makeSettings(),
    ...overrides,
  }
}

describe('syncToSchema', () => {
  it('syncs phase and basic fields', () => {
    const state = makeGameState()
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.phase).toBe(GamePhase.InProgress)
    expect(schema.currentTurnIndex).toBe(0)
    expect(schema.winnerId).toBe('')
  })

  it('syncs players', () => {
    const state = makeGameState()
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.players.length).toBe(2)
    const p1 = schema.players.at(0)
    expect(p1?.id).toBe('p1')
    expect(p1?.name).toBe('Alice')
    expect(p1?.difficultyLevel).toBe(DifficultyLevel.Level1)
    expect(p1?.abilities.management).toBe(2)
    expect(p1?.connected).toBe(true)
    expect(p1?.ready).toBe(true)
  })

  it('syncs player monsters and bonus cards', () => {
    const state = makeGameState()
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    const p1 = schema.players.at(0)
    expect(p1?.monstersTamed.length).toBe(1)
    expect(p1?.monstersTamed.at(0)?.id).toBe('boyaka')
    expect(p1?.monstersTamed.at(0)?.abilities.management).toBe(3)
    expect(p1?.bonusCards.length).toBe(1)
    expect(p1?.bonusCards.at(0)?.id).toBe('supergame')
  })

  it('syncs turn order', () => {
    const state = makeGameState()
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.turnOrder.length).toBe(2)
    expect(schema.turnOrder.at(0)).toBe('p1')
    expect(schema.turnOrder.at(1)).toBe('p2')
  })

  it('syncs turn state', () => {
    const state = makeGameState()
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.turn).toBeDefined()
    expect(schema.turn?.activePlayerId).toBe('p1')
    expect(schema.turn?.phase).toBe(TurnPhase.ChoosingAction)
  })

  it('syncs turn with all optional fields', () => {
    const battleResult: BattleResult = {
      victory: true,
      comparisons: {
        [AbilityName.Management]: { playerScore: 3, monsterScore: 1, playerWins: true },
        [AbilityName.Communication]: { playerScore: 2, monsterScore: 2, playerWins: false },
        [AbilityName.Orientation]: { playerScore: 4, monsterScore: 3, playerWins: true },
        [AbilityName.Processing]: { playerScore: 5, monsterScore: 0, playerWins: true },
        [AbilityName.MovementEnergy]: { playerScore: 1, monsterScore: 1, playerWins: false },
      },
    }
    const turn: TurnState = {
      activePlayerId: 'p1',
      phase: TurnPhase.MonsterBattle,
      chosenAction: TurnAction.DrawFromCosmos,
      drawnCard: makeMonster(),
      drawnCardType: CardType.Monster,
      battleResult,
    }
    const state = makeGameState({ turn })
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.turn?.chosenAction).toBe(TurnAction.DrawFromCosmos)
    expect(schema.turn?.drawnMonster?.id).toBe('boyaka')
    expect(schema.turn?.drawnBonus).toBeUndefined()
    expect(schema.turn?.drawnCardType).toBe(CardType.Monster)
    expect(schema.turn?.battleResult?.victory).toBe(true)
    expect(schema.turn?.battleResult?.comparisons.get(AbilityName.Management)?.playerWins).toBe(
      true,
    )
  })

  it('syncs drawn bonus card correctly', () => {
    const turn: TurnState = {
      activePlayerId: 'p1',
      phase: TurnPhase.TurnComplete,
      chosenAction: TurnAction.DrawFromCosmos,
      drawnCard: makeBonus(),
      drawnCardType: CardType.Bonus,
    }
    const state = makeGameState({ turn })
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.turn?.drawnBonus?.id).toBe('supergame')
    expect(schema.turn?.drawnMonster).toBeUndefined()
    expect(schema.turn?.drawnCardType).toBe(CardType.Bonus)
  })

  it('syncs turn with task and die roll', () => {
    const turn: TurnState = {
      activePlayerId: 'p1',
      phase: TurnPhase.CompletingTask,
      chosenAction: TurnAction.DevelopAbility,
      chosenAbility: AbilityName.Management,
      dieRoll: { taskNumber: 5, wasRerolled: false, rerollCount: 0 },
      currentTask: makeTask(),
    }
    const state = makeGameState({ turn })
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.turn?.chosenAbility).toBe(AbilityName.Management)
    expect(schema.turn?.dieRoll?.taskNumber).toBe(5)
    expect(schema.turn?.currentTask?.id).toBe('management-1')
    expect(schema.turn?.currentTask?.rewards.at(0)).toBe(AbilityName.Management)
  })

  it('syncs task title, instructions, and requirements', () => {
    const task = makeTask()
    task.requirements = { ru: 'Нужен компьютер' }
    const turn: TurnState = {
      activePlayerId: 'p1',
      phase: TurnPhase.CompletingTask,
      chosenAction: TurnAction.DevelopAbility,
      chosenAbility: AbilityName.Management,
      dieRoll: { taskNumber: 1, wasRerolled: false, rerollCount: 0 },
      currentTask: task,
    }
    const state = makeGameState({ turn })
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.turn?.currentTask?.title).toBe('Взломай код')
    expect(schema.turn?.currentTask?.instructions).toBe('<p>Level 1</p>')
    expect(schema.turn?.currentTask?.requirements).toBe('Нужен компьютер')
  })

  it('resolves instructions by active player difficulty level', () => {
    const turn: TurnState = {
      activePlayerId: 'p1',
      phase: TurnPhase.CompletingTask,
      chosenAction: TurnAction.DevelopAbility,
      chosenAbility: AbilityName.Management,
      dieRoll: { taskNumber: 1, wasRerolled: false, rerollCount: 0 },
      currentTask: makeTask(),
    }
    const p1 = makePlayer('p1', 'Alice')
    p1.difficultyLevel = DifficultyLevel.Level2
    const state = makeGameState({ turn, players: [p1, makePlayer('p2', 'Bob')] })
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.turn?.currentTask?.instructions).toBe('<p>Level 2</p>')
  })

  it('defaults requirements to empty string when absent', () => {
    const turn: TurnState = {
      activePlayerId: 'p1',
      phase: TurnPhase.CompletingTask,
      chosenAction: TurnAction.DevelopAbility,
      chosenAbility: AbilityName.Management,
      dieRoll: { taskNumber: 1, wasRerolled: false, rerollCount: 0 },
      currentTask: makeTask(),
    }
    const state = makeGameState({ turn })
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.turn?.currentTask?.requirements).toBe('')
  })

  it('clears turn when null', () => {
    const state = makeGameState({ turn: null })
    const schema = new GameStateSchema()
    // First set a turn
    const stateWithTurn = makeGameState()
    syncToSchema(stateWithTurn, schema)
    expect(schema.turn).toBeDefined()
    // Now clear it
    syncToSchema(state, schema)
    expect(schema.turn).toBeUndefined()
  })

  it('does NOT sync cosmosDeck or discardPile — only cosmosDeckSize', () => {
    const state = makeGameState()
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.cosmosDeckSize).toBe(3)
    // Schema has no cosmosDeck or discardPile fields
    expect((schema as unknown as Record<string, unknown>).cosmosDeck).toBeUndefined()
    expect((schema as unknown as Record<string, unknown>).discardPile).toBeUndefined()
  })

  it('does NOT sync rolledTasks', () => {
    const state = makeGameState({ rolledTasks: { management: new Set([1, 2, 3]) } })
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect((schema as unknown as Record<string, unknown>).rolledTasks).toBeUndefined()
  })

  it('syncs winnerId', () => {
    const state = makeGameState({ winnerId: 'p1', phase: GamePhase.Finished })
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.winnerId).toBe('p1')
    expect(schema.phase).toBe(GamePhase.Finished)
  })

  it('syncs room settings', () => {
    const state = makeGameState()
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.roomSettings.maxPlayers).toBe(4)
    expect(schema.roomSettings.taskTimeLimitSeconds).toBe(120)
    expect(schema.roomSettings.roomName).toBe('Test Room')
    expect(schema.roomSettings.roomCode).toBe('ABC123')
  })

  it('syncs event log', () => {
    const events: GameEvent[] = [
      {
        id: 'evt_1',
        timestamp: Date.now(),
        playerId: 'p1',
        message: 'Game started',
        type: GameEventType.GameStarted,
      },
    ]
    const state = makeGameState({ eventLog: events })
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.eventLog.length).toBe(1)
    expect(schema.eventLog.at(0)?.type).toBe(GameEventType.GameStarted)
  })

  it('updates existing schema on re-sync', () => {
    const state = makeGameState()
    const schema = new GameStateSchema()
    syncToSchema(state, schema)
    expect(schema.players.length).toBe(2)

    // Modify state and re-sync
    state.players[0].abilities.management = 5
    state.currentTurnIndex = 1
    syncToSchema(state, schema)
    expect(schema.players.at(0)?.abilities.management).toBe(5)
    expect(schema.currentTurnIndex).toBe(1)
  })
})
