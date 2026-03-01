import { AbilityName } from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { DIE_SIDES } from './constants'
import { getRolledTaskKey, markTaskRolled, rollDie } from './dice'

describe('getRolledTaskKey', () => {
  it('returns the ability name as the key', () => {
    expect(getRolledTaskKey(AbilityName.Management)).toBe('management')
  })
})

describe('rollDie', () => {
  it('returns a number between 1 and 20', () => {
    const result = rollDie(AbilityName.Management, {}, () => 0.5)
    expect(result.taskNumber).toBeGreaterThanOrEqual(1)
    expect(result.taskNumber).toBeLessThanOrEqual(DIE_SIDES)
  })

  it('uses the injected random function', () => {
    // randomFn returning 0 picks index 0 from available = [1..20], so taskNumber 1
    const result = rollDie(AbilityName.Management, {}, () => 0)
    expect(result.taskNumber).toBe(1)
  })

  it('returns wasRerolled false on first roll for an ability', () => {
    const result = rollDie(AbilityName.Management, {}, () => 0.5)
    expect(result.wasRerolled).toBe(false)
    expect(result.rerollCount).toBe(0)
  })

  it('never returns a used number', () => {
    const used = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
    const rolledTasks = { [AbilityName.Management]: used }

    // Only number 20 is available, any random value should give 20
    const result = rollDie(AbilityName.Management, rolledTasks, () => 0)
    expect(result.taskNumber).toBe(20)
    expect(result.wasRerolled).toBe(true)
  })

  it('selects from available numbers only', () => {
    const used = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) // odd numbers used
    const rolledTasks = { [AbilityName.Management]: used }

    // Available: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] (10 numbers)
    // randomFn 0 picks index 0 = 2
    const result = rollDie(AbilityName.Management, rolledTasks, () => 0)
    expect(result.taskNumber).toBe(2)
    expect(result.wasRerolled).toBe(true)
  })

  it('resets when all 20 numbers are exhausted', () => {
    const allUsed = new Set(Array.from({ length: 20 }, (_, i) => i + 1))
    const rolledTasks = { [AbilityName.Management]: allUsed }

    // All exhausted → full set available again, randomFn 0.5 picks from middle
    const result = rollDie(AbilityName.Management, rolledTasks, () => 0.5)
    expect(result.taskNumber).toBe(11)
    expect(result.wasRerolled).toBe(false)
  })

  it('does not affect other abilities', () => {
    const used = new Set([11])
    const rolledTasks = { [AbilityName.Communication]: used }

    // Management has no used numbers, so 11 is available
    const result = rollDie(AbilityName.Management, rolledTasks, () => 0.5)
    expect(result.taskNumber).toBe(11)
    expect(result.wasRerolled).toBe(false)
  })

  it('works with empty rolledTasks', () => {
    // 20 available numbers, randomFn 0.95 → index floor(0.95*20)=19 → number 20
    const result = rollDie(AbilityName.Orientation, {}, () => 0.95)
    expect(result.taskNumber).toBe(20)
    expect(result.wasRerolled).toBe(false)
  })

  it('guarantees O(1) selection regardless of used count', () => {
    // Even with 19/20 used, only one randomFn call needed
    const used = new Set(Array.from({ length: 19 }, (_, i) => i + 1)) // 1-19 used
    const rolledTasks = { [AbilityName.Management]: used }
    let callCount = 0
    const result = rollDie(AbilityName.Management, rolledTasks, () => {
      callCount++
      return 0
    })
    expect(result.taskNumber).toBe(20)
    expect(callCount).toBe(1)
  })
})

describe('markTaskRolled', () => {
  it('adds a task number to the set', () => {
    const result = markTaskRolled({}, AbilityName.Management, 5)
    expect(result[AbilityName.Management].has(5)).toBe(true)
  })

  it('preserves existing entries', () => {
    const existing = { [AbilityName.Management]: new Set([3]) }
    const result = markTaskRolled(existing, AbilityName.Management, 5)
    expect(result[AbilityName.Management].has(3)).toBe(true)
    expect(result[AbilityName.Management].has(5)).toBe(true)
  })

  it('does not mutate the original', () => {
    const original: Record<string, Set<number>> = {}
    markTaskRolled(original, AbilityName.Management, 5)
    expect(original[AbilityName.Management]).toBeUndefined()
  })

  it('preserves other abilities', () => {
    const existing = { [AbilityName.Communication]: new Set([7]) }
    const result = markTaskRolled(existing, AbilityName.Management, 5)
    expect(result[AbilityName.Communication].has(7)).toBe(true)
  })
})
