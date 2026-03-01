import { ArraySchema, MapSchema, Schema, defineTypes } from '@colyseus/schema'

export class AbilityScoresSchema extends Schema {
  management = 0
  communication = 0
  orientation = 0
  processing = 0
  movementEnergy = 0
}
defineTypes(AbilityScoresSchema, {
  management: 'uint8',
  communication: 'uint8',
  orientation: 'uint8',
  processing: 'uint8',
  movementEnergy: 'uint8',
})

export class MonsterCardSchema extends Schema {
  id = ''
  name = ''
  abilities = new AbilityScoresSchema()
  imageUrl = ''
}
defineTypes(MonsterCardSchema, {
  id: 'string',
  name: 'string',
  abilities: AbilityScoresSchema,
  imageUrl: 'string',
})

export class BonusCardSchema extends Schema {
  id = ''
  name = ''
  description = ''
  effectType = ''
  imageUrl = ''
}
defineTypes(BonusCardSchema, {
  id: 'string',
  name: 'string',
  description: 'string',
  effectType: 'string',
  imageUrl: 'string',
})

export class TaskSchema extends Schema {
  id = ''
  abilityName = ''
  taskNumber = 0
  rewards = new ArraySchema<string>()
  taskType = ''
}
defineTypes(TaskSchema, {
  id: 'string',
  abilityName: 'string',
  taskNumber: 'uint8',
  rewards: ['string'],
  taskType: 'string',
})

export class DieRollSchema extends Schema {
  taskNumber = 0
  wasRerolled = false
  rerollCount = 0
}
defineTypes(DieRollSchema, {
  taskNumber: 'uint8',
  wasRerolled: 'boolean',
  rerollCount: 'uint8',
})

export class AbilityComparisonSchema extends Schema {
  playerScore = 0
  monsterScore = 0
  playerWins = false
}
defineTypes(AbilityComparisonSchema, {
  playerScore: 'uint8',
  monsterScore: 'uint8',
  playerWins: 'boolean',
})

export class BattleResultSchema extends Schema {
  victory = false
  comparisons = new MapSchema<AbilityComparisonSchema>()
}
defineTypes(BattleResultSchema, {
  victory: 'boolean',
  comparisons: { map: AbilityComparisonSchema },
})

export class GameEventSchema extends Schema {
  id = ''
  timestamp = 0
  playerId = ''
  message = ''
  type = ''
}
defineTypes(GameEventSchema, {
  id: 'string',
  timestamp: 'number',
  playerId: 'string',
  message: 'string',
  type: 'string',
})

export class PlayerSchema extends Schema {
  id = ''
  name = ''
  difficultyLevel = 1
  abilities = new AbilityScoresSchema()
  monstersTamed = new ArraySchema<MonsterCardSchema>()
  bonusCards = new ArraySchema<BonusCardSchema>()
  connected = true
  ready = false
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
  activePlayerId = ''
  phase = ''
  chosenAction?: string
  chosenAbility?: string
  dieRoll?: DieRollSchema
  currentTask?: TaskSchema
  drawnMonster?: MonsterCardSchema
  drawnBonus?: BonusCardSchema
  drawnCardType?: string
  battleResult?: BattleResultSchema
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
  maxPlayers = 4
  taskTimeLimitSeconds = 120
  roomName = ''
  roomCode = ''
}
defineTypes(RoomSettingsSchema, {
  maxPlayers: 'uint8',
  taskTimeLimitSeconds: 'uint16',
  roomName: 'string',
  roomCode: 'string',
})

export class GameStateSchema extends Schema {
  phase = ''
  players = new ArraySchema<PlayerSchema>()
  turnOrder = new ArraySchema<string>()
  currentTurnIndex = 0
  turn?: TurnSchema
  cosmosDeckSize = 0
  eventLog = new ArraySchema<GameEventSchema>()
  winnerId = ''
  roomSettings = new RoomSettingsSchema()
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
