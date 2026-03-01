import { AbilityName, DifficultyLevel, GamePhase, type MonsterCard } from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { createGameState, createPlayer } from './create-game'
import { checkGameOver, checkWinCondition } from './win-condition'

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
