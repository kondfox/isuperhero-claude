import { AbilityName, DifficultyLevel, GamePhase, type MonsterCard } from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { createGameState, createPlayer } from './create-game'
import { checkGameOver, checkWinCondition, getGameSummary } from './win-condition'

function makeMonster(id: string): MonsterCard {
  return {
    id,
    name: `Monster ${id}`,
    abilities: {
      [AbilityName.Management]: 1,
      [AbilityName.Communication]: 1,
      [AbilityName.Orientation]: 1,
      [AbilityName.Processing]: 1,
      [AbilityName.MovementEnergy]: 1,
    },
    imageUrl: `${id}.png`,
  }
}

describe('checkWinCondition', () => {
  it('returns false with 0 monsters', () => {
    const player = createPlayer('p1', 'Alice', DifficultyLevel.Level1)
    expect(checkWinCondition(player)).toBe(false)
  })

  it('returns false with 1 monster', () => {
    const player = {
      ...createPlayer('p1', 'Alice', DifficultyLevel.Level1),
      monstersTamed: [makeMonster('m1')],
    }
    expect(checkWinCondition(player)).toBe(false)
  })

  it('returns false with 2 monsters', () => {
    const player = {
      ...createPlayer('p1', 'Alice', DifficultyLevel.Level1),
      monstersTamed: [makeMonster('m1'), makeMonster('m2')],
    }
    expect(checkWinCondition(player)).toBe(false)
  })

  it('returns true with 3 monsters', () => {
    const player = {
      ...createPlayer('p1', 'Alice', DifficultyLevel.Level1),
      monstersTamed: [makeMonster('m1'), makeMonster('m2'), makeMonster('m3')],
    }
    expect(checkWinCondition(player)).toBe(true)
  })
})

describe('checkGameOver', () => {
  it('returns null when no player has won', () => {
    const state = createGameState({
      maxPlayers: 2,
      taskTimeLimitSeconds: 60,
      roomName: 'Test',
      roomCode: 'ABC123',
    })
    state.players = [
      createPlayer('p1', 'Alice', DifficultyLevel.Level1),
      createPlayer('p2', 'Bob', DifficultyLevel.Level2),
    ]
    expect(checkGameOver(state)).toBeNull()
  })

  it("returns the winner's ID when a player has 3 monsters", () => {
    const state = createGameState({
      maxPlayers: 2,
      taskTimeLimitSeconds: 60,
      roomName: 'Test',
      roomCode: 'ABC123',
    })
    state.players = [
      createPlayer('p1', 'Alice', DifficultyLevel.Level1),
      {
        ...createPlayer('p2', 'Bob', DifficultyLevel.Level2),
        monstersTamed: [makeMonster('m1'), makeMonster('m2'), makeMonster('m3')],
      },
    ]
    expect(checkGameOver(state)).toBe('p2')
  })

  it('returns the first winner found', () => {
    const state = createGameState({
      maxPlayers: 2,
      taskTimeLimitSeconds: 60,
      roomName: 'Test',
      roomCode: 'ABC123',
    })
    const monsters = [makeMonster('m1'), makeMonster('m2'), makeMonster('m3')]
    state.players = [
      { ...createPlayer('p1', 'Alice', DifficultyLevel.Level1), monstersTamed: monsters },
      { ...createPlayer('p2', 'Bob', DifficultyLevel.Level2), monstersTamed: monsters },
    ]
    expect(checkGameOver(state)).toBe('p1')
  })
})

const defaultSettings = {
  maxPlayers: 4,
  taskTimeLimitSeconds: 60,
  roomName: 'Test',
  roomCode: 'ABC123',
}

describe('getGameSummary', () => {
  function makeFinishedGame() {
    const state = createGameState(defaultSettings)
    const p1 = {
      ...createPlayer('p1', 'Alice', DifficultyLevel.Level1),
      monstersTamed: [makeMonster('m1'), makeMonster('m2'), makeMonster('m3')],
      abilities: {
        [AbilityName.Management]: 3,
        [AbilityName.Communication]: 2,
        [AbilityName.Orientation]: 4,
        [AbilityName.Processing]: 1,
        [AbilityName.MovementEnergy]: 5,
      },
      bonusCardsUsed: 2,
    }
    const p2 = {
      ...createPlayer('p2', 'Bob', DifficultyLevel.Level2),
      monstersTamed: [makeMonster('m4'), makeMonster('m5')],
      abilities: {
        [AbilityName.Management]: 5,
        [AbilityName.Communication]: 5,
        [AbilityName.Orientation]: 5,
        [AbilityName.Processing]: 5,
        [AbilityName.MovementEnergy]: 5,
      },
      bonusCardsUsed: 1,
    }
    return {
      ...state,
      phase: GamePhase.Finished,
      players: [p1, p2],
      turnOrder: ['p1', 'p2'],
      currentTurnIndex: 5,
      winnerId: 'p1',
      turn: null,
    }
  }

  it('returns correct winner info', () => {
    const state = makeFinishedGame()
    const summary = getGameSummary(state)
    expect(summary.winnerId).toBe('p1')
    expect(summary.winnerName).toBe('Alice')
  })

  it('calculates totalTurns from currentTurnIndex', () => {
    const state = makeFinishedGame()
    const summary = getGameSummary(state)
    expect(summary.totalTurns).toBe(5)
  })

  it('ranks players by monstersCount desc', () => {
    const state = makeFinishedGame()
    const summary = getGameSummary(state)
    expect(summary.playerRankings[0].playerId).toBe('p1')
    expect(summary.playerRankings[0].monstersCount).toBe(3)
    expect(summary.playerRankings[1].playerId).toBe('p2')
    expect(summary.playerRankings[1].monstersCount).toBe(2)
  })

  it('breaks ties by totalAbilityScore desc', () => {
    const state = makeFinishedGame()
    // Give both players same monster count
    state.players[1] = {
      ...state.players[1],
      monstersTamed: [makeMonster('m4'), makeMonster('m5'), makeMonster('m6')],
    }
    const summary = getGameSummary(state)
    // p2 has 25 total ability, p1 has 15
    expect(summary.playerRankings[0].playerId).toBe('p2')
    expect(summary.playerRankings[0].totalAbilityScore).toBe(25)
    expect(summary.playerRankings[1].playerId).toBe('p1')
    expect(summary.playerRankings[1].totalAbilityScore).toBe(15)
  })

  it('includes bonusCardsUsed in rankings', () => {
    const state = makeFinishedGame()
    const summary = getGameSummary(state)
    expect(summary.playerRankings[0].bonusCardsUsed).toBe(2)
    expect(summary.playerRankings[1].bonusCardsUsed).toBe(1)
  })

  it('throws when no winner', () => {
    const state = { ...makeFinishedGame(), winnerId: null }
    expect(() => getGameSummary(state)).toThrow('No winner')
  })

  it('throws when winner not found in players', () => {
    const state = { ...makeFinishedGame(), winnerId: 'nonexistent' }
    expect(() => getGameSummary(state)).toThrow('Winner not found in players')
  })
})
