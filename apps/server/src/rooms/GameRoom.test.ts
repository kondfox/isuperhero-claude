import { createInitialAbilities } from '@isuperhero/game-logic'
import type { BonusCard, GameState, MonsterCard } from '@isuperhero/types'
import {
  AbilityName,
  CardType,
  DifficultyLevel,
  GamePhase,
  TurnAction,
  TurnPhase,
} from '@isuperhero/types'
import { describe, expect, it, vi } from 'vitest'
import { GameStateSchema } from '../schemas/index'
import { GameRoom } from './GameRoom'

/**
 * We test the GameRoom by directly calling lifecycle methods.
 * To avoid the full Colyseus server stack (which conflicts with Vitest),
 * we create a room instance with minimal mocking.
 */
function createMockClient(sessionId: string) {
  return {
    sessionId,
    send: vi.fn(),
  }
}

function createRoom(): GameRoom {
  const room = Object.create(GameRoom.prototype) as GameRoom
  // Initialize the minimal fields that Room expects
  Object.defineProperty(room, 'state', {
    value: new GameStateSchema(),
    writable: true,
    configurable: true,
  })
  // Replace setState with a simple assignment
  ;(room as unknown as { setState: (s: GameStateSchema) => void }).setState = function (
    s: GameStateSchema,
  ) {
    Object.defineProperty(this, 'state', {
      value: s,
      writable: true,
      configurable: true,
    })
  }
  // Stub clock
  ;(room as unknown as { clock: { start: () => void } }).clock = { start: vi.fn() }
  return room
}

function bootRoom(
  room: GameRoom,
  options: {
    roomName?: string
    roomCode?: string
    maxPlayers?: number
    taskTimeLimitSeconds?: number
    name?: string
    difficultyLevel?: DifficultyLevel
  } = {},
): void {
  const defaults = {
    roomName: 'Test',
    roomCode: 'TEST',
    maxPlayers: 4,
    taskTimeLimitSeconds: 120,
    name: 'Alice',
    difficultyLevel: DifficultyLevel.Level1,
  }
  // Store message handlers so we can invoke them
  const handlers = new Map<string, (client: unknown, data: unknown) => void>()
  ;(
    room as unknown as {
      onMessage: (type: string, handler: (client: unknown, data: unknown) => void) => void
    }
  ).onMessage = (type: string, handler: (client: unknown, data: unknown) => void) => {
    handlers.set(type, handler)
  }
  ;(
    room as unknown as { _handlers: Map<string, (client: unknown, data: unknown) => void> }
  )._handlers = handlers
  ;(room as unknown as { maxClients: number }).maxClients = 4

  room.onCreate({ ...defaults, ...options })
}

function sendMessage(room: GameRoom, type: string, client: unknown, data: unknown = {}): void {
  const handlers = (
    room as unknown as { _handlers: Map<string, (client: unknown, data: unknown) => void> }
  )._handlers
  const handler = handlers.get(type)
  if (!handler) throw new Error(`No handler for message type: ${type}`)
  handler(client, data)
}

function getGameState(room: GameRoom): GameState {
  return (room as unknown as { gameState: GameState }).gameState
}

describe('GameRoom', () => {
  describe('onCreate', () => {
    it('initializes with WaitingForPlayers phase', () => {
      const room = createRoom()
      bootRoom(room)
      expect(room.state.phase).toBe(GamePhase.WaitingForPlayers)
      expect(room.state.cosmosDeckSize).toBeGreaterThan(0)
      expect(room.state.roomSettings.roomCode).toBe('TEST')
    })

    it('uses custom room settings', () => {
      const room = createRoom()
      bootRoom(room, { maxPlayers: 2, taskTimeLimitSeconds: 60, roomName: 'Custom' })
      expect(room.state.roomSettings.maxPlayers).toBe(2)
      expect(room.state.roomSettings.taskTimeLimitSeconds).toBe(60)
      expect(room.state.roomSettings.roomName).toBe('Custom')
    })
  })

  describe('onJoin', () => {
    it('adds a player', () => {
      const room = createRoom()
      bootRoom(room)
      const client = createMockClient('p1')
      room.onJoin(client as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      expect(room.state.players.length).toBe(1)
      expect(room.state.players.at(0)?.name).toBe('Alice')
    })

    it('adds multiple players', () => {
      const room = createRoom()
      bootRoom(room)
      room.onJoin(createMockClient('p1') as never, {
        name: 'Alice',
        difficultyLevel: DifficultyLevel.Level1,
      })
      room.onJoin(createMockClient('p2') as never, {
        name: 'Bob',
        difficultyLevel: DifficultyLevel.Level2,
      })
      expect(room.state.players.length).toBe(2)
      expect(room.state.players.at(1)?.name).toBe('Bob')
      expect(room.state.players.at(1)?.difficultyLevel).toBe(DifficultyLevel.Level2)
    })
  })

  describe('onLeave', () => {
    it('removes player during WaitingForPlayers', () => {
      const room = createRoom()
      bootRoom(room)
      const client = createMockClient('p1')
      room.onJoin(client as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      expect(room.state.players.length).toBe(1)
      room.onLeave(client as never)
      expect(room.state.players.length).toBe(0)
    })

    it('marks player disconnected during game', () => {
      const room = createRoom()
      bootRoom(room, { maxPlayers: 2 })
      const c1 = createMockClient('p1')
      const c2 = createMockClient('p2')
      room.onJoin(c1 as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      room.onJoin(c2 as never, { name: 'Bob', difficultyLevel: DifficultyLevel.Level1 })
      sendMessage(room, 'playerReady', c1, { ready: true })
      sendMessage(room, 'playerReady', c2, { ready: true })
      sendMessage(room, 'startGame', c1)
      expect(room.state.phase).toBe(GamePhase.InProgress)

      room.onLeave(c2 as never)
      const state = getGameState(room)
      const p2 = state.players.find((p) => p.id === 'p2')
      expect(p2?.connected).toBe(false)
    })
  })

  describe('playerReady', () => {
    it('sets player ready status', () => {
      const room = createRoom()
      bootRoom(room)
      const client = createMockClient('p1')
      room.onJoin(client as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      sendMessage(room, 'playerReady', client, { ready: true })
      expect(room.state.players.at(0)?.ready).toBe(true)
    })

    it('can toggle ready off', () => {
      const room = createRoom()
      bootRoom(room)
      const client = createMockClient('p1')
      room.onJoin(client as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      sendMessage(room, 'playerReady', client, { ready: true })
      sendMessage(room, 'playerReady', client, { ready: false })
      expect(room.state.players.at(0)?.ready).toBe(false)
    })
  })

  describe('startGame', () => {
    it('starts game with 2 ready players', () => {
      const room = createRoom()
      bootRoom(room, { maxPlayers: 2 })
      const c1 = createMockClient('p1')
      const c2 = createMockClient('p2')
      room.onJoin(c1 as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      room.onJoin(c2 as never, { name: 'Bob', difficultyLevel: DifficultyLevel.Level1 })
      sendMessage(room, 'playerReady', c1, { ready: true })
      sendMessage(room, 'playerReady', c2, { ready: true })
      sendMessage(room, 'startGame', c1)
      expect(room.state.phase).toBe(GamePhase.InProgress)
      expect(room.state.turn?.phase).toBe(TurnPhase.ChoosingAction)
    })

    it('sends error if not enough players', () => {
      const room = createRoom()
      bootRoom(room)
      const client = createMockClient('p1')
      room.onJoin(client as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      sendMessage(room, 'playerReady', client, { ready: true })
      sendMessage(room, 'startGame', client)
      expect(client.send).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ message: expect.any(String) }),
      )
      expect(room.state.phase).toBe(GamePhase.WaitingForPlayers)
    })
  })

  describe('develop ability flow', () => {
    function setupGameInProgress() {
      const room = createRoom()
      bootRoom(room, { maxPlayers: 2 })
      const c1 = createMockClient('p1')
      const c2 = createMockClient('p2')
      room.onJoin(c1 as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      room.onJoin(c2 as never, { name: 'Bob', difficultyLevel: DifficultyLevel.Level1 })
      sendMessage(room, 'playerReady', c1, { ready: true })
      sendMessage(room, 'playerReady', c2, { ready: true })
      sendMessage(room, 'startGame', c1)

      const activeId = room.state.turn?.activePlayerId
      const activeClient = activeId === 'p1' ? c1 : c2
      const inactiveClient = activeId === 'p1' ? c2 : c1
      return { room, c1, c2, activeClient, inactiveClient, activeId }
    }

    it('chooseAction → ChoosingAbility', () => {
      const { room, activeClient } = setupGameInProgress()
      sendMessage(room, 'chooseAction', activeClient, { action: TurnAction.DevelopAbility })
      expect(room.state.turn?.phase).toBe(TurnPhase.ChoosingAbility)
      expect(room.state.turn?.chosenAction).toBe(TurnAction.DevelopAbility)
    })

    it('chooseAbility → RollingDie', () => {
      const { room, activeClient } = setupGameInProgress()
      sendMessage(room, 'chooseAction', activeClient, { action: TurnAction.DevelopAbility })
      sendMessage(room, 'chooseAbility', activeClient, { ability: AbilityName.Management })
      expect(room.state.turn?.phase).toBe(TurnPhase.RollingDie)
      expect(room.state.turn?.chosenAbility).toBe(AbilityName.Management)
    })

    it('rollDie → CompletingTask', () => {
      const { room, activeClient } = setupGameInProgress()
      sendMessage(room, 'chooseAction', activeClient, { action: TurnAction.DevelopAbility })
      sendMessage(room, 'chooseAbility', activeClient, { ability: AbilityName.Management })
      sendMessage(room, 'rollDie', activeClient)
      expect(room.state.turn?.phase).toBe(TurnPhase.CompletingTask)
      expect(room.state.turn?.dieRoll).toBeDefined()
      expect(room.state.turn?.currentTask).toBeDefined()
    })

    it('rollDie uses fallback task when task index is empty', () => {
      const { room, activeClient } = setupGameInProgress()
      // Clear the task index to simulate CI (no tasks-data.ts)
      ;(room as unknown as { taskIndex: Map<string, unknown> }).taskIndex.clear()
      sendMessage(room, 'chooseAction', activeClient, { action: TurnAction.DevelopAbility })
      sendMessage(room, 'chooseAbility', activeClient, { ability: AbilityName.Management })
      sendMessage(room, 'rollDie', activeClient)
      expect(room.state.turn?.phase).toBe(TurnPhase.CompletingTask)
      expect(room.state.turn?.currentTask).toBeDefined()
      expect(room.state.turn?.currentTask?.abilityName).toBe(AbilityName.Management)
    })

    it('taskComplete success → ChoosingAction (allows optional draw)', () => {
      const { room, activeClient, activeId } = setupGameInProgress()
      sendMessage(room, 'chooseAction', activeClient, { action: TurnAction.DevelopAbility })
      sendMessage(room, 'chooseAbility', activeClient, { ability: AbilityName.Management })
      sendMessage(room, 'rollDie', activeClient)
      sendMessage(room, 'taskComplete', activeClient, { success: true })
      expect(room.state.turn?.phase).toBe(TurnPhase.ChoosingAction)
    })

    it('taskComplete failure → ChoosingAction (allows optional draw)', () => {
      const { room, activeClient } = setupGameInProgress()
      sendMessage(room, 'chooseAction', activeClient, { action: TurnAction.DevelopAbility })
      sendMessage(room, 'chooseAbility', activeClient, { ability: AbilityName.Management })
      sendMessage(room, 'rollDie', activeClient)
      sendMessage(room, 'taskComplete', activeClient, { success: false })
      expect(room.state.turn?.phase).toBe(TurnPhase.ChoosingAction)
    })

    it('endTurn after develop advances to next player', () => {
      const { room, activeClient, activeId } = setupGameInProgress()
      sendMessage(room, 'chooseAction', activeClient, { action: TurnAction.DevelopAbility })
      sendMessage(room, 'chooseAbility', activeClient, { ability: AbilityName.Management })
      sendMessage(room, 'rollDie', activeClient)
      sendMessage(room, 'taskComplete', activeClient, { success: false })
      sendMessage(room, 'endTurn', activeClient)
      expect(room.state.turn?.activePlayerId).not.toBe(activeId)
      expect(room.state.turn?.phase).toBe(TurnPhase.ChoosingAction)
    })
  })

  describe('draw from cosmos flow', () => {
    function setupGameInProgress() {
      const room = createRoom()
      bootRoom(room, { maxPlayers: 2 })
      const c1 = createMockClient('p1')
      const c2 = createMockClient('p2')
      room.onJoin(c1 as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      room.onJoin(c2 as never, { name: 'Bob', difficultyLevel: DifficultyLevel.Level1 })
      sendMessage(room, 'playerReady', c1, { ready: true })
      sendMessage(room, 'playerReady', c2, { ready: true })
      sendMessage(room, 'startGame', c1)

      const activeId = room.state.turn?.activePlayerId
      const activeClient = activeId === 'p1' ? c1 : c2
      return { room, c1, c2, activeClient }
    }

    it('draws a card and resolves automatically', () => {
      const { room, activeClient } = setupGameInProgress()
      const deckBefore = room.state.cosmosDeckSize
      sendMessage(room, 'chooseAction', activeClient, { action: TurnAction.DrawFromCosmos })

      // Card should have been drawn
      expect(room.state.cosmosDeckSize).toBe(deckBefore - 1)
      expect(room.state.turn?.drawnCardType).toBeDefined()

      // Should be at MonsterBattle, BattleDefeatPenalty, or TurnComplete
      const phase = room.state.turn?.phase
      expect([TurnPhase.TurnComplete, TurnPhase.BattleDefeatPenalty]).toContain(phase)
    })
  })

  describe('error handling', () => {
    function setupGameInProgress() {
      const room = createRoom()
      bootRoom(room, { maxPlayers: 2 })
      const c1 = createMockClient('p1')
      const c2 = createMockClient('p2')
      room.onJoin(c1 as never, { name: 'Alice', difficultyLevel: DifficultyLevel.Level1 })
      room.onJoin(c2 as never, { name: 'Bob', difficultyLevel: DifficultyLevel.Level1 })
      sendMessage(room, 'playerReady', c1, { ready: true })
      sendMessage(room, 'playerReady', c2, { ready: true })
      sendMessage(room, 'startGame', c1)

      const activeId = room.state.turn?.activePlayerId
      const activeClient = activeId === 'p1' ? c1 : c2
      const inactiveClient = activeId === 'p1' ? c2 : c1
      return { room, activeClient, inactiveClient }
    }

    it('sends error when inactive player tries to act', () => {
      const { room, inactiveClient } = setupGameInProgress()
      sendMessage(room, 'chooseAction', inactiveClient, { action: TurnAction.DevelopAbility })
      expect(inactiveClient.send).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ message: expect.any(String) }),
      )
    })

    it('sends error for wrong phase action', () => {
      const { room, activeClient } = setupGameInProgress()
      sendMessage(room, 'rollDie', activeClient)
      expect(activeClient.send).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ message: expect.any(String) }),
      )
    })

    it('sends error for endTurn when not TurnComplete', () => {
      const { room, activeClient } = setupGameInProgress()
      sendMessage(room, 'endTurn', activeClient)
      expect(activeClient.send).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ message: expect.any(String) }),
      )
    })
  })
})
