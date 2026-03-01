import { AbilityName } from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { TASKS } from './tasks'

const hasData = TASKS.length > 0

describe.runIf(hasData)('TASKS (local data)', () => {
  it('contains exactly 100 tasks', () => {
    expect(TASKS).toHaveLength(100)
  })

  it('has 20 tasks per ability', () => {
    const byAbility = new Map<string, number>()
    for (const t of TASKS) {
      byAbility.set(t.abilityName, (byAbility.get(t.abilityName) ?? 0) + 1)
    }
    expect(byAbility.get(AbilityName.Management)).toBe(20)
    expect(byAbility.get(AbilityName.Communication)).toBe(20)
    expect(byAbility.get(AbilityName.Orientation)).toBe(20)
    expect(byAbility.get(AbilityName.Processing)).toBe(20)
    expect(byAbility.get(AbilityName.MovementEnergy)).toBe(20)
  })

  it('each task has a unique id', () => {
    const ids = TASKS.map((t) => t.id)
    expect(new Set(ids).size).toBe(100)
  })

  it('each task has exactly 2 rewards', () => {
    for (const t of TASKS) {
      expect(t.rewards).toHaveLength(2)
    }
  })

  it('each task has all 3 levels with Russian content', () => {
    for (const t of TASKS) {
      expect(t.levels['1'].ru).toBeTruthy()
      expect(t.levels['2'].ru).toBeTruthy()
      expect(t.levels['3'].ru).toBeTruthy()
    }
  })

  it('each task has a Russian title', () => {
    for (const t of TASKS) {
      expect(t.title.ru).toBeTruthy()
    }
  })

  it('task numbers range from 1 to 20', () => {
    for (const t of TASKS) {
      expect(t.taskNumber).toBeGreaterThanOrEqual(1)
      expect(t.taskNumber).toBeLessThanOrEqual(20)
    }
  })
})

describe('TASKS export', () => {
  it('exports an array', () => {
    expect(Array.isArray(TASKS)).toBe(true)
  })
})
