import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { bonusCards, monsters, tasks } from './schema'

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
})
