import { describe, expect, it } from 'vitest'
import { schemaToSnapshot } from './schema-to-snapshot'

/**
 * Create a mock that simulates a Colyseus ArraySchema:
 * - It's an object (not a plain array)
 * - It's iterable via Symbol.iterator
 * - It has a toJSON() that returns a plain array
 */
function mockArraySchema<T>(items: T[]): Iterable<T> & { toJSON(): T[] } {
  return {
    [Symbol.iterator]() {
      return items[Symbol.iterator]()
    },
    toJSON() {
      return items
    },
  }
}

/**
 * Simulates a Colyseus Schema object where:
 * - toJSON() returns defaults/empty data (broken client toJSON)
 * - Direct property access returns the correctly synced values
 */
function makeMockColyseusState() {
  return {
    // toJSON() returns shape-valid but empty/default data
    toJSON() {
      return {
        phase: 'waitingForPlayers',
        players: [],
        turnOrder: [],
        currentTurnIndex: 0,
        cosmosDeckSize: 0,
        eventLog: [],
        winnerId: '',
        roomSettings: {
          maxPlayers: 4,
          taskTimeLimitSeconds: 120,
          roomName: '',
          roomCode: '',
        },
      }
    },

    // Direct properties hold the real synced values
    phase: 'waitingForPlayers',
    players: mockArraySchema([
      {
        id: 'player-1',
        name: 'Alice',
        difficultyLevel: 1,
        abilities: {
          management: 0,
          communication: 0,
          orientation: 0,
          processing: 0,
          movementEnergy: 0,
        },
        monstersTamed: mockArraySchema([]),
        bonusCards: mockArraySchema([]),
        connected: true,
        ready: false,
      },
    ]),
    turnOrder: mockArraySchema([]),
    currentTurnIndex: 0,
    cosmosDeckSize: 42,
    eventLog: mockArraySchema([]),
    winnerId: '',
    roomSettings: {
      maxPlayers: 2,
      taskTimeLimitSeconds: 90,
      roomName: 'My Room',
      roomCode: 'ABC123',
    },
  }
}

describe('schemaToSnapshot', () => {
  it('returns emptySnapshot for null/undefined input', () => {
    const result = schemaToSnapshot(null)
    expect(result.phase).toBe('')
    expect(result.players).toEqual([])
    expect(result.roomSettings.maxPlayers).toBe(4)
  })

  it('returns emptySnapshot for non-object input', () => {
    const result = schemaToSnapshot('not an object')
    expect(result.players).toEqual([])
  })

  it('extracts players from Colyseus-like schema (ignoring broken toJSON)', () => {
    const mock = makeMockColyseusState()
    const result = schemaToSnapshot(mock)

    expect(result.players).toHaveLength(1)
    expect(result.players[0].id).toBe('player-1')
    expect(result.players[0].name).toBe('Alice')
  })

  it('extracts roomSettings from schema properties (not toJSON defaults)', () => {
    const mock = makeMockColyseusState()
    const result = schemaToSnapshot(mock)

    expect(result.roomSettings.maxPlayers).toBe(2)
    expect(result.roomSettings.taskTimeLimitSeconds).toBe(90)
    expect(result.roomSettings.roomName).toBe('My Room')
    expect(result.roomSettings.roomCode).toBe('ABC123')
  })

  it('extracts cosmosDeckSize from schema', () => {
    const mock = makeMockColyseusState()
    const result = schemaToSnapshot(mock)

    expect(result.cosmosDeckSize).toBe(42)
  })

  it('handles plain object state (e.g., already-converted JSON)', () => {
    const plain = {
      phase: 'waitingForPlayers',
      players: [
        {
          id: 'p1',
          name: 'Bob',
          difficultyLevel: 2,
          abilities: {
            management: 1,
            communication: 2,
            orientation: 0,
            processing: 0,
            movementEnergy: 0,
          },
          monstersTamed: [],
          bonusCards: [],
          connected: true,
          ready: true,
        },
      ],
      turnOrder: ['p1'],
      currentTurnIndex: 0,
      cosmosDeckSize: 50,
      eventLog: [],
      winnerId: '',
      roomSettings: {
        maxPlayers: 3,
        taskTimeLimitSeconds: 60,
        roomName: 'Test',
        roomCode: 'XYZ789',
      },
    }

    const result = schemaToSnapshot(plain)
    expect(result.players).toHaveLength(1)
    expect(result.players[0].name).toBe('Bob')
    expect(result.roomSettings.maxPlayers).toBe(3)
    expect(result.roomSettings.roomCode).toBe('XYZ789')
  })

  it('extracts turn data when present', () => {
    const mock = {
      phase: 'inProgress',
      players: [],
      turnOrder: [],
      currentTurnIndex: 0,
      cosmosDeckSize: 10,
      eventLog: [],
      winnerId: '',
      roomSettings: { maxPlayers: 4, taskTimeLimitSeconds: 120, roomName: '', roomCode: '' },
      turn: {
        activePlayerId: 'p1',
        phase: 'choosingAction',
        chosenAction: undefined,
        chosenAbility: undefined,
        dieRoll: undefined,
        currentTask: undefined,
        drawnMonster: undefined,
        drawnBonus: undefined,
        drawnCardType: undefined,
        battleResult: undefined,
      },
    }

    const result = schemaToSnapshot(mock)
    expect(result.turn).toBeDefined()
    expect(result.turn?.activePlayerId).toBe('p1')
    expect(result.turn?.phase).toBe('choosingAction')
  })

  it('extracts event log entries', () => {
    const mock = {
      phase: 'inProgress',
      players: [],
      turnOrder: [],
      currentTurnIndex: 0,
      cosmosDeckSize: 10,
      eventLog: mockArraySchema([
        {
          id: 'evt-1',
          timestamp: 12345,
          playerId: 'p1',
          message: 'Player joined',
          type: 'playerJoined',
        },
      ]),
      winnerId: '',
      roomSettings: { maxPlayers: 4, taskTimeLimitSeconds: 120, roomName: '', roomCode: '' },
    }

    const result = schemaToSnapshot(mock)
    expect(result.eventLog).toHaveLength(1)
    expect(result.eventLog[0].message).toBe('Player joined')
  })
})
