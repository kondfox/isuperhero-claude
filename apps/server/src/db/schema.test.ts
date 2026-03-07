import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import {
  authTokens,
  bonusCards,
  gameParticipants,
  gameRecords,
  monsters,
  players,
  tasks,
} from './schema'

describe('database schema', () => {
  it('defines tasks table', () => {
    expect(getTableName(tasks)).toBe('tasks')
  })

  it('defines monsters table', () => {
    expect(getTableName(monsters)).toBe('monsters')
  })

  it('defines bonus_cards table', () => {
    expect(getTableName(bonusCards)).toBe('bonus_cards')
  })

  it('defines players table', () => {
    expect(getTableName(players)).toBe('players')
  })

  it('defines game_records table', () => {
    expect(getTableName(gameRecords)).toBe('game_records')
  })

  it('defines game_participants table', () => {
    expect(getTableName(gameParticipants)).toBe('game_participants')
  })

  it('defines auth_tokens table', () => {
    expect(getTableName(authTokens)).toBe('auth_tokens')
  })
})
