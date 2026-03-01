import type { AbilityName, DieRollResult, PlayerId } from '@isuperhero/types'
import { DIE_SIDES } from './constants'

export function getRolledTaskKey(abilityName: AbilityName): string {
  return abilityName
}

export function rollDie(
  abilityName: AbilityName,
  rolledTasks: Record<string, Set<number>>,
  randomFn: () => number = Math.random,
): DieRollResult {
  const key = getRolledTaskKey(abilityName)
  const usedNumbers = rolledTasks[key] ?? new Set<number>()

  // Build list of available numbers, reset if all exhausted
  const allNumbers = Array.from({ length: DIE_SIDES }, (_, i) => i + 1)
  const available =
    usedNumbers.size >= DIE_SIDES ? allNumbers : allNumbers.filter((n) => !usedNumbers.has(n))

  const index = Math.floor(randomFn() * available.length)
  const taskNumber = available[index]

  return {
    taskNumber,
    wasRerolled: usedNumbers.size > 0 && usedNumbers.size < DIE_SIDES,
    rerollCount: 0,
  }
}

export function markTaskRolled(
  rolledTasks: Record<string, Set<number>>,
  abilityName: AbilityName,
  taskNumber: number,
): Record<string, Set<number>> {
  const key = getRolledTaskKey(abilityName)
  const existing = rolledTasks[key] ?? new Set<number>()
  const updated = new Set(existing)
  updated.add(taskNumber)
  return { ...rolledTasks, [key]: updated }
}
