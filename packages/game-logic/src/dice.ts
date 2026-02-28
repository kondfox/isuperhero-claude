import type { AbilityName, DieRollResult, PlayerId } from "@isuperhero/types";
import { DIE_SIDES } from "./constants";

export function getRolledTaskKey(abilityName: AbilityName): string {
  return abilityName;
}

export function rollDie(
  abilityName: AbilityName,
  rolledTasks: Record<string, Set<number>>,
  randomFn: () => number = Math.random,
): DieRollResult {
  const key = getRolledTaskKey(abilityName);
  let usedNumbers = rolledTasks[key] ?? new Set<number>();

  // If all 20 are exhausted, reset
  if (usedNumbers.size >= DIE_SIDES) {
    usedNumbers = new Set<number>();
  }

  let taskNumber: number;
  let rerollCount = 0;

  do {
    taskNumber = Math.floor(randomFn() * DIE_SIDES) + 1;
    if (usedNumbers.has(taskNumber)) {
      rerollCount++;
    }
  } while (usedNumbers.has(taskNumber));

  return {
    taskNumber,
    wasRerolled: rerollCount > 0,
    rerollCount,
  };
}

export function markTaskRolled(
  rolledTasks: Record<string, Set<number>>,
  abilityName: AbilityName,
  taskNumber: number,
): Record<string, Set<number>> {
  const key = getRolledTaskKey(abilityName);
  const existing = rolledTasks[key] ?? new Set<number>();
  const updated = new Set(existing);
  updated.add(taskNumber);
  return { ...rolledTasks, [key]: updated };
}
