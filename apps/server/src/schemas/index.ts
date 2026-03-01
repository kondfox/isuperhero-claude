import { ArraySchema, MapSchema, Schema, defineTypes } from '@colyseus/schema'

/**
 * All schema classes use `declare` for typed fields instead of class field
 * initializers. This is required because Bun's transpiler uses
 * `Object.defineProperty` for class fields, which replaces the getter/setter
 * descriptors that `@colyseus/schema` sets up for change tracking.
 *
 * Defaults are set in constructors via direct assignment (which triggers
 * the schema setters after `super()` applies them).
 */

export class AbilityScoresSchema extends Schema {
  declare management: number
  declare communication: number
  declare orientation: number
  declare processing: number
  declare movementEnergy: number

  constructor() {
    super()
    this.management = 0
    this.communication = 0
    this.orientation = 0
    this.processing = 0
    this.movementEnergy = 0
  }
}
defineTypes(AbilityScoresSchema, {
  management: 'uint8',
  communication: 'uint8',
  orientation: 'uint8',
  processing: 'uint8',
  movementEnergy: 'uint8',
})

export class MonsterCardSchema extends Schema {
  declare id: string
  declare name: string
  declare abilities: AbilityScoresSchema
  declare imageUrl: string

  constructor() {
    super()
    this.id = ''
    this.name = ''
    this.abilities = new AbilityScoresSchema()
    this.imageUrl = ''
  }
}
defineTypes(MonsterCardSchema, {
  id: 'string',
  name: 'string',
  abilities: AbilityScoresSchema,
  imageUrl: 'string',
})

export class BonusCardSchema extends Schema {
  declare id: string
  declare name: string
  declare description: string
  declare effectType: string
  declare imageUrl: string

  constructor() {
    super()
    this.id = ''
    this.name = ''
    this.description = ''
    this.effectType = ''
    this.imageUrl = ''
  }
}
defineTypes(BonusCardSchema, {
  id: 'string',
  name: 'string',
  description: 'string',
  effectType: 'string',
  imageUrl: 'string',
})

export class TaskSchema extends Schema {
  declare id: string
  declare abilityName: string
  declare taskNumber: number
  declare rewards: ArraySchema<string>
  declare taskType: string

  constructor() {
    super()
    this.id = ''
    this.abilityName = ''
    this.taskNumber = 0
    this.rewards = new ArraySchema<string>()
    this.taskType = ''
  }
}
defineTypes(TaskSchema, {
  id: 'string',
  abilityName: 'string',
  taskNumber: 'uint8',
  rewards: ['string'],
  taskType: 'string',
})

export class DieRollSchema extends Schema {
  declare taskNumber: number
  declare wasRerolled: boolean
  declare rerollCount: number

  constructor() {
    super()
    this.taskNumber = 0
    this.wasRerolled = false
    this.rerollCount = 0
  }
}
defineTypes(DieRollSchema, {
  taskNumber: 'uint8',
  wasRerolled: 'boolean',
  rerollCount: 'uint8',
})

export class AbilityComparisonSchema extends Schema {
  declare playerScore: number
  declare monsterScore: number
  declare playerWins: boolean

  constructor() {
    super()
    this.playerScore = 0
    this.monsterScore = 0
    this.playerWins = false
  }
}
defineTypes(AbilityComparisonSchema, {
  playerScore: 'uint8',
  monsterScore: 'uint8',
  playerWins: 'boolean',
})

export class BattleResultSchema extends Schema {
  declare victory: boolean
  declare comparisons: MapSchema<AbilityComparisonSchema>

  constructor() {
    super()
    this.victory = false
    this.comparisons = new MapSchema<AbilityComparisonSchema>()
  }
}
defineTypes(BattleResultSchema, {
  victory: 'boolean',
  comparisons: { map: AbilityComparisonSchema },
})

export class GameEventSchema extends Schema {
  declare id: string
  declare timestamp: number
  declare playerId: string
  declare message: string
  declare type: string

  constructor() {
    super()
    this.id = ''
    this.timestamp = 0
    this.playerId = ''
    this.message = ''
    this.type = ''
  }
}
defineTypes(GameEventSchema, {
  id: 'string',
  timestamp: 'number',
  playerId: 'string',
  message: 'string',
  type: 'string',
})

export class PlayerSchema extends Schema {
  declare id: string
  declare name: string
  declare difficultyLevel: number
  declare abilities: AbilityScoresSchema
  declare monstersTamed: ArraySchema<MonsterCardSchema>
  declare bonusCards: ArraySchema<BonusCardSchema>
  declare connected: boolean
  declare ready: boolean

  constructor() {
    super()
    this.id = ''
    this.name = ''
    this.difficultyLevel = 1
    this.abilities = new AbilityScoresSchema()
    this.monstersTamed = new ArraySchema<MonsterCardSchema>()
    this.bonusCards = new ArraySchema<BonusCardSchema>()
    this.connected = true
    this.ready = false
  }
}
defineTypes(PlayerSchema, {
  id: 'string',
  name: 'string',
  difficultyLevel: 'uint8',
  abilities: AbilityScoresSchema,
  monstersTamed: [MonsterCardSchema],
  bonusCards: [BonusCardSchema],
  connected: 'boolean',
  ready: 'boolean',
})

export class TurnSchema extends Schema {
  declare activePlayerId: string
  declare phase: string
  declare chosenAction: string | undefined
  declare chosenAbility: string | undefined
  declare dieRoll: DieRollSchema | undefined
  declare currentTask: TaskSchema | undefined
  declare drawnMonster: MonsterCardSchema | undefined
  declare drawnBonus: BonusCardSchema | undefined
  declare drawnCardType: string | undefined
  declare battleResult: BattleResultSchema | undefined

  constructor() {
    super()
    this.activePlayerId = ''
    this.phase = ''
  }
}
defineTypes(TurnSchema, {
  activePlayerId: 'string',
  phase: 'string',
  chosenAction: 'string',
  chosenAbility: 'string',
  dieRoll: DieRollSchema,
  currentTask: TaskSchema,
  drawnMonster: MonsterCardSchema,
  drawnBonus: BonusCardSchema,
  drawnCardType: 'string',
  battleResult: BattleResultSchema,
})

export class RoomSettingsSchema extends Schema {
  declare maxPlayers: number
  declare taskTimeLimitSeconds: number
  declare roomName: string
  declare roomCode: string

  constructor() {
    super()
    this.maxPlayers = 4
    this.taskTimeLimitSeconds = 120
    this.roomName = ''
    this.roomCode = ''
  }
}
defineTypes(RoomSettingsSchema, {
  maxPlayers: 'uint8',
  taskTimeLimitSeconds: 'uint16',
  roomName: 'string',
  roomCode: 'string',
})

export class GameStateSchema extends Schema {
  declare phase: string
  declare players: ArraySchema<PlayerSchema>
  declare turnOrder: ArraySchema<string>
  declare currentTurnIndex: number
  declare turn: TurnSchema | undefined
  declare cosmosDeckSize: number
  declare eventLog: ArraySchema<GameEventSchema>
  declare winnerId: string
  declare roomSettings: RoomSettingsSchema

  constructor() {
    super()
    this.phase = ''
    this.players = new ArraySchema<PlayerSchema>()
    this.turnOrder = new ArraySchema<string>()
    this.currentTurnIndex = 0
    this.cosmosDeckSize = 0
    this.eventLog = new ArraySchema<GameEventSchema>()
    this.winnerId = ''
    this.roomSettings = new RoomSettingsSchema()
  }
}
defineTypes(GameStateSchema, {
  phase: 'string',
  players: [PlayerSchema],
  turnOrder: ['string'],
  currentTurnIndex: 'uint8',
  turn: TurnSchema,
  cosmosDeckSize: 'uint8',
  eventLog: [GameEventSchema],
  winnerId: 'string',
  roomSettings: RoomSettingsSchema,
})
