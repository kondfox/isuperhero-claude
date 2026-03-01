import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema'

export class AbilityScoresSchema extends Schema {
  @type('uint8') management = 0
  @type('uint8') communication = 0
  @type('uint8') orientation = 0
  @type('uint8') processing = 0
  @type('uint8') movementEnergy = 0
}

export class MonsterCardSchema extends Schema {
  @type('string') id = ''
  @type('string') name = ''
  @type(AbilityScoresSchema) abilities = new AbilityScoresSchema()
  @type('string') imageUrl = ''
}

export class BonusCardSchema extends Schema {
  @type('string') id = ''
  @type('string') name = ''
  @type('string') description = ''
  @type('string') effectType = ''
  @type('string') imageUrl = ''
}

export class TaskSchema extends Schema {
  @type('string') id = ''
  @type('string') abilityName = ''
  @type('uint8') taskNumber = 0
  @type('string') titleRu = ''
  @type('string') titleEn = ''
  @type(['string']) rewards = new ArraySchema<string>()
  @type('string') requirementsRu = ''
  @type('string') requirementsEn = ''
  @type('string') contentHtml = ''
  @type('string') taskType = ''
}

export class DieRollSchema extends Schema {
  @type('uint8') taskNumber = 0
  @type('boolean') wasRerolled = false
  @type('uint8') rerollCount = 0
}

export class AbilityComparisonSchema extends Schema {
  @type('uint8') playerScore = 0
  @type('uint8') monsterScore = 0
  @type('boolean') playerWins = false
}

export class BattleResultSchema extends Schema {
  @type('boolean') victory = false
  @type({ map: AbilityComparisonSchema }) comparisons = new MapSchema<AbilityComparisonSchema>()
}

export class GameEventSchema extends Schema {
  @type('string') id = ''
  @type('number') timestamp = 0
  @type('string') playerId = ''
  @type('string') message = ''
  @type('string') type = ''
}

export class PlayerSchema extends Schema {
  @type('string') id = ''
  @type('string') name = ''
  @type('uint8') difficultyLevel = 1
  @type(AbilityScoresSchema) abilities = new AbilityScoresSchema()
  @type([MonsterCardSchema]) monstersTamed = new ArraySchema<MonsterCardSchema>()
  @type([BonusCardSchema]) bonusCards = new ArraySchema<BonusCardSchema>()
  @type('boolean') connected = true
  @type('boolean') ready = false
}

export class TurnSchema extends Schema {
  @type('string') activePlayerId = ''
  @type('string') phase = ''
  @type('string') chosenAction?: string
  @type('string') chosenAbility?: string
  @type(DieRollSchema) dieRoll?: DieRollSchema
  @type(TaskSchema) currentTask?: TaskSchema
  @type(MonsterCardSchema) drawnMonster?: MonsterCardSchema
  @type(BonusCardSchema) drawnBonus?: BonusCardSchema
  @type('string') drawnCardType?: string
  @type(BattleResultSchema) battleResult?: BattleResultSchema
}

export class RoomSettingsSchema extends Schema {
  @type('uint8') maxPlayers = 4
  @type('uint16') taskTimeLimitSeconds = 120
  @type('string') roomName = ''
  @type('string') roomCode = ''
}

export class GameStateSchema extends Schema {
  @type('string') phase = ''
  @type([PlayerSchema]) players = new ArraySchema<PlayerSchema>()
  @type(['string']) turnOrder = new ArraySchema<string>()
  @type('uint8') currentTurnIndex = 0
  @type(TurnSchema) turn?: TurnSchema
  @type('uint8') cosmosDeckSize = 0
  @type([GameEventSchema]) eventLog = new ArraySchema<GameEventSchema>()
  @type('string') winnerId = ''
  @type(RoomSettingsSchema) roomSettings = new RoomSettingsSchema()
}
