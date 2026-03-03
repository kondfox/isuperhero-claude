import { ArraySchema, MapSchema } from '@colyseus/schema'
import { isMonsterCard } from '@isuperhero/game-logic'
import type {
  BattleResult,
  BonusCard,
  GameEvent,
  GameState,
  MonsterCard,
  PlayerState,
  TaskDefinition,
  TurnState,
} from '@isuperhero/types'
import { CardType } from '@isuperhero/types'
import {
  AbilityComparisonSchema,
  type AbilityScoresSchema,
  BattleResultSchema,
  BonusCardSchema,
  DieRollSchema,
  GameEventSchema,
  type GameStateSchema,
  MonsterCardSchema,
  PlayerSchema,
  RoomSettingsSchema,
  TaskSchema,
  TurnSchema,
} from './schemas/index'

function syncAbilityScores(source: PlayerState['abilities'], target: AbilityScoresSchema): void {
  target.management = source.management
  target.communication = source.communication
  target.orientation = source.orientation
  target.processing = source.processing
  target.movementEnergy = source.movementEnergy
}

function syncMonsterCard(source: MonsterCard): MonsterCardSchema {
  const schema = new MonsterCardSchema()
  schema.id = source.id
  schema.name = source.name
  schema.imageUrl = source.imageUrl
  syncAbilityScores(source.abilities, schema.abilities)
  return schema
}

function syncBonusCard(source: BonusCard): BonusCardSchema {
  const schema = new BonusCardSchema()
  schema.id = source.id
  schema.name = source.name
  schema.description = source.description
  schema.effectType = source.effectType
  schema.imageUrl = source.imageUrl
  return schema
}

function syncTask(source: TaskDefinition, difficultyLevel: number): TaskSchema {
  const schema = new TaskSchema()
  schema.id = source.id
  schema.abilityName = source.abilityName
  schema.taskNumber = source.taskNumber
  schema.rewards = new ArraySchema<string>(...source.rewards)
  schema.taskType = source.taskType
  schema.title = source.title.ru ?? ''
  schema.instructions = source.levels[String(difficultyLevel)]?.ru ?? ''
  schema.requirements = source.requirements?.ru ?? ''
  return schema
}

function syncBattleResult(source: BattleResult): BattleResultSchema {
  const schema = new BattleResultSchema()
  schema.victory = source.victory
  schema.comparisons = new MapSchema<AbilityComparisonSchema>()
  for (const [ability, comp] of Object.entries(source.comparisons)) {
    const compSchema = new AbilityComparisonSchema()
    compSchema.playerScore = comp.playerScore
    compSchema.monsterScore = comp.monsterScore
    compSchema.playerWins = comp.playerWins
    schema.comparisons.set(ability, compSchema)
  }
  return schema
}

function syncPlayer(source: PlayerState): PlayerSchema {
  const schema = new PlayerSchema()
  schema.id = source.id
  schema.name = source.name
  schema.difficultyLevel = source.difficultyLevel
  syncAbilityScores(source.abilities, schema.abilities)
  schema.monstersTamed = new ArraySchema<MonsterCardSchema>(
    ...source.monstersTamed.map(syncMonsterCard),
  )
  schema.bonusCards = new ArraySchema<BonusCardSchema>(...source.bonusCards.map(syncBonusCard))
  schema.connected = source.connected
  schema.ready = source.ready
  return schema
}

function syncTurn(source: TurnState, difficultyLevel: number): TurnSchema {
  const schema = new TurnSchema()
  schema.activePlayerId = source.activePlayerId
  schema.phase = source.phase

  if (source.chosenAction) {
    schema.chosenAction = source.chosenAction
  }
  if (source.chosenAbility) {
    schema.chosenAbility = source.chosenAbility
  }
  if (source.dieRoll) {
    schema.dieRoll = new DieRollSchema()
    schema.dieRoll.taskNumber = source.dieRoll.taskNumber
    schema.dieRoll.wasRerolled = source.dieRoll.wasRerolled
    schema.dieRoll.rerollCount = source.dieRoll.rerollCount
  }
  if (source.currentTask) {
    schema.currentTask = syncTask(source.currentTask, difficultyLevel)
  }
  if (source.drawnCard && source.drawnCardType) {
    schema.drawnCardType = source.drawnCardType
    if (source.drawnCardType === CardType.Monster && isMonsterCard(source.drawnCard)) {
      schema.drawnMonster = syncMonsterCard(source.drawnCard)
    } else {
      schema.drawnBonus = syncBonusCard(source.drawnCard as BonusCard)
    }
  }
  if (source.battleResult) {
    schema.battleResult = syncBattleResult(source.battleResult)
  }
  return schema
}

function syncEvent(source: GameEvent): GameEventSchema {
  const schema = new GameEventSchema()
  schema.id = source.id
  schema.timestamp = source.timestamp
  schema.playerId = source.playerId
  schema.message = source.message
  schema.type = source.type
  return schema
}

export function syncToSchema(state: GameState, schema: GameStateSchema): void {
  schema.phase = state.phase
  schema.currentTurnIndex = state.currentTurnIndex
  schema.winnerId = state.winnerId ?? ''
  schema.cosmosDeckSize = state.cosmosDeck.length

  // Players
  schema.players.clear()
  for (const player of state.players) {
    schema.players.push(syncPlayer(player))
  }

  // Turn order
  schema.turnOrder.clear()
  for (const id of state.turnOrder) {
    schema.turnOrder.push(id)
  }

  // Turn
  if (state.turn) {
    const activePlayer = state.players.find((p) => p.id === state.turn?.activePlayerId)
    const difficultyLevel = activePlayer?.difficultyLevel ?? 1
    schema.turn = syncTurn(state.turn, difficultyLevel)
  } else {
    schema.turn = undefined
  }

  // Event log
  schema.eventLog.clear()
  for (const event of state.eventLog) {
    schema.eventLog.push(syncEvent(event))
  }

  // Room settings
  schema.roomSettings.maxPlayers = state.roomSettings.maxPlayers
  schema.roomSettings.taskTimeLimitSeconds = state.roomSettings.taskTimeLimitSeconds
  schema.roomSettings.roomName = state.roomSettings.roomName
  schema.roomSettings.roomCode = state.roomSettings.roomCode
}
