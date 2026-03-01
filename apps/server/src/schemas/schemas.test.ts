import { ArraySchema, MapSchema } from '@colyseus/schema'
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
import {
  AbilityComparisonSchema,
  AbilityScoresSchema,
  BattleResultSchema,
  BonusCardSchema,
  DieRollSchema,
  GameEventSchema,
  GameStateSchema,
  MonsterCardSchema,
  PlayerSchema,
  RoomSettingsSchema,
  TaskSchema,
  TurnSchema,
} from './index'

describe('AbilityScoresSchema', () => {
  it('initializes with all zeros', () => {
    const scores = new AbilityScoresSchema()
    expect(scores.management).toBe(0)
    expect(scores.communication).toBe(0)
    expect(scores.orientation).toBe(0)
    expect(scores.processing).toBe(0)
    expect(scores.movementEnergy).toBe(0)
  })

  it('can set individual scores', () => {
    const scores = new AbilityScoresSchema()
    scores.management = 3
    scores.movementEnergy = 5
    expect(scores.management).toBe(3)
    expect(scores.movementEnergy).toBe(5)
  })
})

describe('MonsterCardSchema', () => {
  it('stores card data', () => {
    const card = new MonsterCardSchema()
    card.id = 'boyaka'
    card.name = 'Бояка'
    card.imageUrl = '/images/monsters/boyaka.png'
    card.abilities = new AbilityScoresSchema()
    card.abilities.management = 3
    expect(card.id).toBe('boyaka')
    expect(card.abilities.management).toBe(3)
  })
})

describe('BonusCardSchema', () => {
  it('stores card data', () => {
    const card = new BonusCardSchema()
    card.id = 'supergame'
    card.name = 'Суперигра'
    card.description = 'Extra turn'
    card.effectType = 'extraTurn'
    card.imageUrl = '/images/bonus/supergame.png'
    expect(card.id).toBe('supergame')
    expect(card.effectType).toBe('extraTurn')
  })
})

describe('TaskSchema', () => {
  it('stores task data with i18n', () => {
    const task = new TaskSchema()
    task.id = 'management-1'
    task.abilityName = AbilityName.Management
    task.taskNumber = 1
    task.taskType = TaskType.Digital
    task.rewards = new ArraySchema<string>()
    task.rewards.push(AbilityName.Management, AbilityName.Processing)
    expect(task.id).toBe('management-1')
    expect(task.rewards.length).toBe(2)
    expect(task.rewards.at(0)).toBe(AbilityName.Management)
  })
})

describe('DieRollSchema', () => {
  it('stores die roll result', () => {
    const roll = new DieRollSchema()
    roll.taskNumber = 15
    roll.wasRerolled = true
    roll.rerollCount = 2
    expect(roll.taskNumber).toBe(15)
    expect(roll.wasRerolled).toBe(true)
    expect(roll.rerollCount).toBe(2)
  })
})

describe('AbilityComparisonSchema', () => {
  it('stores comparison result', () => {
    const comp = new AbilityComparisonSchema()
    comp.playerScore = 3
    comp.monsterScore = 2
    comp.playerWins = true
    expect(comp.playerWins).toBe(true)
  })
})

describe('BattleResultSchema', () => {
  it('stores battle outcome with comparisons', () => {
    const result = new BattleResultSchema()
    result.victory = true
    result.comparisons = new MapSchema<AbilityComparisonSchema>()
    const comp = new AbilityComparisonSchema()
    comp.playerScore = 3
    comp.monsterScore = 1
    comp.playerWins = true
    result.comparisons.set(AbilityName.Management, comp)
    expect(result.victory).toBe(true)
    expect(result.comparisons.get(AbilityName.Management)?.playerWins).toBe(true)
  })
})

describe('GameEventSchema', () => {
  it('stores event data', () => {
    const event = new GameEventSchema()
    event.id = 'evt_1'
    event.timestamp = 1234567890
    event.playerId = 'p1'
    event.message = 'Player rolled die'
    event.type = GameEventType.DieRolled
    expect(event.id).toBe('evt_1')
    expect(event.type).toBe(GameEventType.DieRolled)
  })
})

describe('PlayerSchema', () => {
  it('stores player state', () => {
    const player = new PlayerSchema()
    player.id = 'p1'
    player.name = 'Alice'
    player.difficultyLevel = DifficultyLevel.Level2
    player.abilities = new AbilityScoresSchema()
    player.monstersTamed = new ArraySchema<MonsterCardSchema>()
    player.bonusCards = new ArraySchema<BonusCardSchema>()
    player.connected = true
    player.ready = false
    expect(player.id).toBe('p1')
    expect(player.difficultyLevel).toBe(2)
    expect(player.connected).toBe(true)
  })
})

describe('TurnSchema', () => {
  it('stores turn state with optional fields', () => {
    const turn = new TurnSchema()
    turn.activePlayerId = 'p1'
    turn.phase = TurnPhase.ChoosingAction
    expect(turn.activePlayerId).toBe('p1')
    expect(turn.phase).toBe(TurnPhase.ChoosingAction)
    // Optional fields default to undefined
    expect(turn.chosenAction).toBeUndefined()
    expect(turn.chosenAbility).toBeUndefined()
    expect(turn.dieRoll).toBeUndefined()
    expect(turn.currentTask).toBeUndefined()
    expect(turn.drawnMonster).toBeUndefined()
    expect(turn.drawnBonus).toBeUndefined()
    expect(turn.drawnCardType).toBeUndefined()
    expect(turn.battleResult).toBeUndefined()
  })

  it('stores full turn with all optional fields set', () => {
    const turn = new TurnSchema()
    turn.activePlayerId = 'p1'
    turn.phase = TurnPhase.CompletingTask
    turn.chosenAction = TurnAction.DevelopAbility
    turn.chosenAbility = AbilityName.Management
    turn.dieRoll = new DieRollSchema()
    turn.dieRoll.taskNumber = 5
    turn.currentTask = new TaskSchema()
    turn.currentTask.id = 'management-5'
    expect(turn.chosenAction).toBe(TurnAction.DevelopAbility)
    expect(turn.dieRoll.taskNumber).toBe(5)
    expect(turn.currentTask.id).toBe('management-5')
  })
})

describe('RoomSettingsSchema', () => {
  it('stores room settings', () => {
    const settings = new RoomSettingsSchema()
    settings.maxPlayers = 4
    settings.taskTimeLimitSeconds = 120
    settings.roomName = 'Test Room'
    settings.roomCode = 'ABC123'
    expect(settings.maxPlayers).toBe(4)
    expect(settings.roomCode).toBe('ABC123')
  })
})

describe('GameStateSchema', () => {
  it('initializes with defaults', () => {
    const state = new GameStateSchema()
    expect(state.phase).toBe('')
    expect(state.players).toBeInstanceOf(ArraySchema)
    expect(state.turnOrder).toBeInstanceOf(ArraySchema)
    expect(state.eventLog).toBeInstanceOf(ArraySchema)
    expect(state.currentTurnIndex).toBe(0)
    expect(state.cosmosDeckSize).toBe(0)
    expect(state.winnerId).toBe('')
  })

  it('stores phase and players', () => {
    const state = new GameStateSchema()
    state.phase = GamePhase.WaitingForPlayers
    const player = new PlayerSchema()
    player.id = 'p1'
    player.name = 'Alice'
    state.players.push(player)
    expect(state.phase).toBe(GamePhase.WaitingForPlayers)
    expect(state.players.length).toBe(1)
    expect(state.players.at(0)?.name).toBe('Alice')
  })

  it('stores turn and room settings', () => {
    const state = new GameStateSchema()
    state.turn = new TurnSchema()
    state.turn.activePlayerId = 'p1'
    state.roomSettings = new RoomSettingsSchema()
    state.roomSettings.maxPlayers = 3
    expect(state.turn.activePlayerId).toBe('p1')
    expect(state.roomSettings.maxPlayers).toBe(3)
  })
})
