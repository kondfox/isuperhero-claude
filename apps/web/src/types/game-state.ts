import type {
  AbilityComparison,
  AbilityScores,
  BattleResult,
  BonusCard,
  DieRollResult,
  GameEvent,
  MonsterCard,
  PlayerState,
  RoomSettings,
} from '@isuperhero/types'

export type {
  AbilityComparison,
  AbilityScores,
  BattleResult,
  BonusCard,
  DieRollResult,
  GameEvent,
  MonsterCard,
  PlayerState,
  RoomSettings,
}

export {
  AbilityName,
  CardType,
  DifficultyLevel,
  GameEventType,
  GamePhase,
  TaskType,
  TurnAction,
  TurnPhase,
} from '@isuperhero/types'

export interface ClientTurnState {
  activePlayerId: string
  phase: string
  chosenAction?: string
  chosenAbility?: string
  dieRoll?: DieRollResult
  currentTask?: {
    id: string
    abilityName: string
    taskNumber: number
    rewards: string[]
    taskType: string
    title: string
    instructions: string
    requirements: string
  }
  drawnMonster?: MonsterCard
  drawnBonus?: BonusCard
  drawnCardType?: string
  battleResult?: BattleResult
}

export interface GameSnapshot {
  phase: string
  players: PlayerState[]
  turnOrder: string[]
  currentTurnIndex: number
  turn?: ClientTurnState
  cosmosDeckSize: number
  eventLog: GameEvent[]
  winnerId: string
  roomSettings: RoomSettings
}
