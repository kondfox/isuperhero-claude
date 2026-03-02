import { BONUS_CARDS, COSMOS_DECK_BONUS_COUNT, MONSTERS, TASKS } from '@isuperhero/game-data'
import {
  addEvent,
  addPlayerToGame,
  advanceToNextPlayer,
  applyBattleDefeatPenalty,
  applyBattleOutcome,
  applyChooseAbility,
  applyChooseAction,
  applyDieRoll,
  applyDrawCard,
  applyTaskComplete,
  canEndTurn,
  checkGameOver,
  createGameEvent,
  createGameState,
  createPlayer,
  createTurn,
  drawCard,
  getCardType,
  isMonsterCard,
  isValidAbilityChoice,
  markTaskRolled,
  removePlayerFromGame,
  resolveBattle,
  rollDie,
  shuffleDeck,
  startGame,
} from '@isuperhero/game-logic'
import type {
  BonusCard,
  GameState,
  MonsterCard,
  RoomSettings,
  TaskDefinition,
} from '@isuperhero/types'
import {
  type AbilityName,
  CardType,
  DifficultyLevel,
  GameEventType,
  GamePhase,
  TaskType,
  TurnAction,
  TurnPhase,
} from '@isuperhero/types'
import type { Client } from 'colyseus'
import { Room } from 'colyseus'
import { GameStateSchema } from '../schemas/index'
import { syncToSchema } from '../sync'

interface JoinOptions {
  name: string
  difficultyLevel: DifficultyLevel
  roomName?: string
  roomCode?: string
  maxPlayers?: number
  taskTimeLimitSeconds?: number
}

function buildCosmosDeck(
  monsters: MonsterCard[],
  bonusCards: BonusCard[],
  bonusCount: number,
): Array<MonsterCard | BonusCard> {
  const deck: Array<MonsterCard | BonusCard> = [...monsters]

  // Distribute bonus cards into the deck
  let remaining = bonusCount
  let cardIndex = 0
  while (remaining > 0 && bonusCards.length > 0) {
    deck.push(bonusCards[cardIndex % bonusCards.length])
    cardIndex++
    remaining--
  }

  return shuffleDeck(deck)
}

function buildTaskIndex(tasks: TaskDefinition[]): Map<string, TaskDefinition> {
  const index = new Map<string, TaskDefinition>()
  for (const task of tasks) {
    const key = `${task.abilityName}-${task.taskNumber}`
    index.set(key, task)
  }
  return index
}

function createFallbackTask(ability: AbilityName, taskNumber: number): TaskDefinition {
  return {
    id: `${ability}-${taskNumber}`,
    abilityName: ability,
    taskNumber,
    title: { ru: `Задание ${taskNumber}`, en: `Task ${taskNumber}` },
    rewards: [ability],
    levels: {
      '1': { ru: '<p>Задание недоступно</p>', en: '<p>Task unavailable</p>' },
      '2': { ru: '<p>Задание недоступно</p>', en: '<p>Task unavailable</p>' },
      '3': { ru: '<p>Задание недоступно</p>', en: '<p>Task unavailable</p>' },
    },
    taskType: TaskType.NonDigital,
  }
}

export class GameRoom extends Room<GameStateSchema> {
  private gameState!: GameState
  private taskIndex: Map<string, TaskDefinition> = new Map()

  onCreate(options: JoinOptions): void {
    const settings: RoomSettings = {
      maxPlayers: options.maxPlayers ?? 4,
      taskTimeLimitSeconds: options.taskTimeLimitSeconds ?? 120,
      roomName: options.roomName ?? 'Game Room',
      roomCode: options.roomCode ?? '',
    }

    this.maxClients = settings.maxPlayers
    this.gameState = createGameState(settings)

    // Build cosmos deck from game data
    this.gameState.cosmosDeck = buildCosmosDeck(MONSTERS, BONUS_CARDS, COSMOS_DECK_BONUS_COUNT)
    this.taskIndex = buildTaskIndex(TASKS)

    // Initialize Colyseus schema
    this.setState(new GameStateSchema())
    this.sync()

    // Register message handlers
    this.onMessage('playerReady', (client, data: { ready: boolean }) => {
      this.handlePlayerReady(client, data.ready)
    })
    this.onMessage('startGame', (client) => {
      this.handleStartGame(client)
    })
    this.onMessage('chooseAction', (client, data: { action: TurnAction }) => {
      this.handleChooseAction(client, data.action)
    })
    this.onMessage('chooseAbility', (client, data: { ability: AbilityName }) => {
      this.handleChooseAbility(client, data.ability)
    })
    this.onMessage('rollDie', (client) => {
      this.handleRollDie(client)
    })
    this.onMessage('taskComplete', (client, data: { success: boolean }) => {
      this.handleTaskComplete(client, data.success)
    })
    this.onMessage('battleDefeatPenalty', (client, data: { ability: AbilityName }) => {
      this.handleBattleDefeatPenalty(client, data.ability)
    })
    this.onMessage('endTurn', (client) => {
      this.handleEndTurn(client)
    })
  }

  onJoin(client: Client, options: JoinOptions): void {
    try {
      const player = createPlayer(
        client.sessionId,
        options.name ?? 'Player',
        options.difficultyLevel ?? DifficultyLevel.Level1,
      )
      this.gameState = addPlayerToGame(this.gameState, player)
      this.sync()
    } catch (err) {
      client.send('error', { message: (err as Error).message })
    }
  }

  onLeave(client: Client): void {
    if (this.gameState.phase === GamePhase.WaitingForPlayers) {
      try {
        this.gameState = removePlayerFromGame(this.gameState, client.sessionId)
      } catch {
        // Player not found, ignore
      }
    } else {
      // Mark as disconnected during game
      this.gameState = {
        ...this.gameState,
        players: this.gameState.players.map((p) =>
          p.id === client.sessionId ? { ...p, connected: false } : p,
        ),
      }

      // If it was their turn, skip to next player
      if (this.gameState.turn?.activePlayerId === client.sessionId) {
        this.gameState = advanceToNextPlayer(this.gameState)
        this.gameState = {
          ...this.gameState,
          turn: createTurn(this.gameState.turnOrder[this.gameState.currentTurnIndex]),
        }
      }
    }
    this.sync()
  }

  private handlePlayerReady(client: Client, ready: boolean): void {
    this.gameState = {
      ...this.gameState,
      players: this.gameState.players.map((p) => (p.id === client.sessionId ? { ...p, ready } : p)),
    }
    this.sync()
  }

  private handleStartGame(client: Client): void {
    try {
      this.gameState = startGame(this.gameState)
      this.sync()
    } catch (err) {
      client.send('error', { message: (err as Error).message })
    }
  }

  private handleChooseAction(client: Client, action: TurnAction): void {
    try {
      this.validateActivePlayer(client)
      this.gameState = applyChooseAction(this.gameState, action)
      this.sync()

      // Auto-transition: DrawFromCosmos → auto-draw card
      if (action === TurnAction.DrawFromCosmos) {
        this.processDrawCard()
      }
    } catch (err) {
      client.send('error', { message: (err as Error).message })
    }
  }

  private handleChooseAbility(client: Client, ability: AbilityName): void {
    try {
      this.validateActivePlayer(client)
      if (!isValidAbilityChoice(ability)) {
        throw new Error(`Invalid ability: ${ability}`)
      }
      this.gameState = applyChooseAbility(this.gameState, ability)
      this.sync()
    } catch (err) {
      client.send('error', { message: (err as Error).message })
    }
  }

  private handleRollDie(client: Client): void {
    try {
      this.validateActivePlayer(client)
      const ability = this.gameState.turn?.chosenAbility
      if (!ability) {
        throw new Error('No ability chosen')
      }

      const rollResult = rollDie(ability, this.gameState.rolledTasks)
      this.gameState.rolledTasks = markTaskRolled(
        this.gameState.rolledTasks,
        ability,
        rollResult.taskNumber,
      )

      // Look up the task, fall back to generic if not in index (e.g. CI, no task data)
      const taskKey = `${ability}-${rollResult.taskNumber}`
      const task = this.taskIndex.get(taskKey) ?? createFallbackTask(ability, rollResult.taskNumber)

      this.gameState = applyDieRoll(this.gameState, rollResult, task)
      this.sync()
    } catch (err) {
      client.send('error', { message: (err as Error).message })
    }
  }

  private handleTaskComplete(client: Client, success: boolean): void {
    try {
      this.validateActivePlayer(client)
      this.gameState = applyTaskComplete(this.gameState, success)
      this.sync()
      this.checkGameOver()
    } catch (err) {
      client.send('error', { message: (err as Error).message })
    }
  }

  private handleBattleDefeatPenalty(client: Client, ability: AbilityName): void {
    try {
      this.validateActivePlayer(client)
      this.gameState = applyBattleDefeatPenalty(this.gameState, ability)
      this.sync()
    } catch (err) {
      client.send('error', { message: (err as Error).message })
    }
  }

  private handleEndTurn(client: Client): void {
    try {
      this.validateActivePlayer(client)
      if (!this.gameState.turn || !canEndTurn(this.gameState.turn)) {
        throw new Error('Turn is not complete')
      }
      this.gameState = advanceToNextPlayer(this.gameState)
      this.gameState = {
        ...this.gameState,
        turn: createTurn(this.gameState.turnOrder[this.gameState.currentTurnIndex]),
      }
      this.sync()
    } catch (err) {
      client.send('error', { message: (err as Error).message })
    }
  }

  private processDrawCard(): void {
    const result = drawCard(this.gameState.cosmosDeck)
    if (!result) {
      // Deck empty — reshuffle discard pile
      this.gameState.cosmosDeck = shuffleDeck([...this.gameState.discardPile])
      this.gameState.discardPile = []
      const retryResult = drawCard(this.gameState.cosmosDeck)
      if (!retryResult) {
        // No cards at all — skip to turn complete
        return
      }
      this.applyDrawnCard(retryResult.card, retryResult.cardType, retryResult.remainingDeck)
    } else {
      this.applyDrawnCard(result.card, result.cardType, result.remainingDeck)
    }
  }

  private applyDrawnCard(
    card: MonsterCard | BonusCard,
    cardType: CardType,
    remainingDeck: Array<MonsterCard | BonusCard>,
  ): void {
    this.gameState.cosmosDeck = remainingDeck
    this.gameState = applyDrawCard(this.gameState, card, cardType)

    // Log card draw event
    const activePlayerId = this.gameState.turn?.activePlayerId ?? ''
    const drawingPlayer = this.gameState.players.find((p) => p.id === activePlayerId)
    const playerName = drawingPlayer?.name ?? 'Player'
    const cardName = 'name' in card ? card.name : 'a card'
    this.gameState = {
      ...this.gameState,
      eventLog: addEvent(
        this.gameState.eventLog,
        createGameEvent(activePlayerId, `${playerName} drew ${cardName}`, GameEventType.CardDrawn),
      ),
    }

    // Auto-resolve monster battle
    if (cardType === CardType.Monster && this.gameState.turn?.phase === TurnPhase.MonsterBattle) {
      const activePlayer = this.gameState.players.find(
        (p) => p.id === this.gameState.turn?.activePlayerId,
      )
      if (activePlayer) {
        const battleResult = resolveBattle(activePlayer, card as MonsterCard)
        this.gameState = applyBattleOutcome(this.gameState, battleResult)
        this.checkGameOver()
      }
    }
    this.sync()
  }

  private validateActivePlayer(client: Client): void {
    if (this.gameState.turn?.activePlayerId !== client.sessionId) {
      throw new Error('Not your turn')
    }
  }

  private checkGameOver(): void {
    const winnerId = checkGameOver(this.gameState)
    if (winnerId) {
      this.gameState = {
        ...this.gameState,
        phase: GamePhase.Finished,
        winnerId,
      }
      this.sync()
    }
  }

  private sync(): void {
    syncToSchema(this.gameState, this.state)
  }
}
