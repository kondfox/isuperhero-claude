// === Branded ID types ===
export type PlayerId = string
export type RoomId = string

// === Enums ===

export enum AbilityName {
  Management = 'management',
  Communication = 'communication',
  Orientation = 'orientation',
  Processing = 'processing',
  MovementEnergy = 'movementEnergy',
}

export enum DifficultyLevel {
  Level1 = 1,
  Level2 = 2,
  Level3 = 3,
}

export enum TurnAction {
  DevelopAbility = 'developAbility',
  DrawFromCosmos = 'drawFromCosmos',
}

export enum TurnPhase {
  ChoosingAction = 'choosingAction',
  ChoosingAbility = 'choosingAbility',
  RollingDie = 'rollingDie',
  CompletingTask = 'completingTask',
  DrawingCard = 'drawingCard',
  MonsterBattle = 'monsterBattle',
  BattleDefeatPenalty = 'battleDefeatPenalty',
  TurnComplete = 'turnComplete',
}

export enum GamePhase {
  WaitingForPlayers = 'waitingForPlayers',
  InProgress = 'inProgress',
  Finished = 'finished',
}

export enum CardType {
  Bonus = 'bonus',
  Monster = 'monster',
}

export enum TaskType {
  Digital = 'digital',
  NonDigital = 'nonDigital',
}

export enum GameEventType {
  TurnStarted = 'turnStarted',
  AbilityChosen = 'abilityChosen',
  DieRolled = 'dieRolled',
  TaskStarted = 'taskStarted',
  TaskCompleted = 'taskCompleted',
  TaskFailed = 'taskFailed',
  AbilityIncreased = 'abilityIncreased',
  CardDrawn = 'cardDrawn',
  MonsterBattle = 'monsterBattle',
  MonsterTamed = 'monsterTamed',
  BattleDefeat = 'battleDefeat',
  AbilityLost = 'abilityLost',
  PlayerJoined = 'playerJoined',
  PlayerLeft = 'playerLeft',
  GameStarted = 'gameStarted',
  GameWon = 'gameWon',
}

// === Core Data Structures ===

export interface AbilityScores {
  [AbilityName.Management]: number
  [AbilityName.Communication]: number
  [AbilityName.Orientation]: number
  [AbilityName.Processing]: number
  [AbilityName.MovementEnergy]: number
}

export interface PlayerState {
  id: PlayerId
  name: string
  difficultyLevel: DifficultyLevel
  abilities: AbilityScores
  monstersTamed: MonsterCard[]
  bonusCards: BonusCard[]
  connected: boolean
  ready: boolean
}

export interface MonsterCard {
  id: string
  name: string
  abilities: AbilityScores
  imageUrl: string
}

export interface BonusCard {
  id: string
  name: string
  description: string
  effectType: string
  imageUrl: string
}

export interface TaskDefinition {
  id: string
  abilityName: AbilityName
  taskNumber: number
  title: Record<string, string>
  rewards: AbilityName[]
  requirements?: Record<string, string>
  levels: Record<string, Record<string, string>>
  imageRefs?: string[]
  taskType: TaskType
}

export interface DieRollResult {
  taskNumber: number
  wasRerolled: boolean
  rerollCount: number
}

export interface AbilityComparison {
  playerScore: number
  monsterScore: number
  playerWins: boolean
}

export interface BattleResult {
  victory: boolean
  comparisons: Record<AbilityName, AbilityComparison>
}

export interface TurnState {
  activePlayerId: PlayerId
  phase: TurnPhase
  chosenAction?: TurnAction
  chosenAbility?: AbilityName
  dieRoll?: DieRollResult
  currentTask?: TaskDefinition
  drawnCard?: MonsterCard | BonusCard
  drawnCardType?: CardType
  battleResult?: BattleResult
}

export interface RoomSettings {
  maxPlayers: number
  taskTimeLimitSeconds: number
  roomName: string
  roomCode: string
}

export interface GameEvent {
  id: string
  timestamp: number
  playerId: PlayerId
  message: string
  type: GameEventType
}

export interface GameState {
  phase: GamePhase
  players: PlayerState[]
  turnOrder: PlayerId[]
  currentTurnIndex: number
  turn: TurnState | null
  rolledTasks: Record<string, Set<number>>
  cosmosDeck: Array<MonsterCard | BonusCard>
  discardPile: Array<MonsterCard | BonusCard>
  eventLog: GameEvent[]
  winnerId: PlayerId | null
  roomSettings: RoomSettings
}

// === Client -> Server Messages ===

export interface ChooseActionMessage {
  type: 'chooseAction'
  action: TurnAction
}

export interface ChooseAbilityMessage {
  type: 'chooseAbility'
  ability: AbilityName
}

export interface RollDieMessage {
  type: 'rollDie'
}

export interface TaskCompleteMessage {
  type: 'taskComplete'
  success: boolean
}

export interface BattleDefeatPenaltyMessage {
  type: 'battleDefeatPenalty'
  ability: AbilityName
}

export interface PlayerReadyMessage {
  type: 'playerReady'
  ready: boolean
}

export interface StartGameMessage {
  type: 'startGame'
}

export type GameMessage =
  | ChooseActionMessage
  | ChooseAbilityMessage
  | RollDieMessage
  | TaskCompleteMessage
  | BattleDefeatPenaltyMessage
  | PlayerReadyMessage
  | StartGameMessage
