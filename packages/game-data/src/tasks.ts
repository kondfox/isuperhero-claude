import type { TaskDefinition } from '@isuperhero/types'

/**
 * Task definitions loaded from the local tasks-data.ts file.
 * This file is git-ignored (contains proprietary game content).
 * For production, tasks are loaded from the database instead.
 *
 * To generate tasks-data.ts locally, run the conversion script
 * against the isuperhero-next source data.
 */
let tasks: TaskDefinition[] = []

try {
  const mod = await import('./tasks-data')
  tasks = mod.TASKS
} catch {
  // tasks-data.ts not available (CI, fresh clone)
  // Tasks will be loaded from DB at runtime
}

export const TASKS = tasks
