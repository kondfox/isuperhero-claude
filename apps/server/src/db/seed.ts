/**
 * Database seed script.
 * Loads game data from @isuperhero/game-data and inserts into PostgreSQL.
 *
 * Usage: bun run db:seed
 * Requires: DATABASE_URL environment variable
 */

import { BONUS_CARDS, MONSTERS, TASKS } from '@isuperhero/game-data'
import { AbilityName } from '@isuperhero/types'
import { db } from './index'
import { bonusCards, monsters, tasks } from './schema'

async function seed() {
  console.log('Seeding database...')

  // Clear existing data
  await db.delete(tasks)
  await db.delete(monsters)
  await db.delete(bonusCards)

  // Seed tasks
  console.log(`Inserting ${TASKS.length} tasks...`)
  for (const task of TASKS) {
    await db.insert(tasks).values({
      id: task.id,
      abilityName: task.abilityName,
      taskNumber: task.taskNumber,
      title: task.title,
      rewards: task.rewards,
      requirements: task.requirements ?? null,
      levels: task.levels,
      imageRefs: task.imageRefs ?? null,
      taskType: task.taskType,
    })
  }

  // Seed monsters
  console.log(`Inserting ${MONSTERS.length} monsters...`)
  for (const m of MONSTERS) {
    await db.insert(monsters).values({
      id: m.id,
      name: m.name,
      management: m.abilities[AbilityName.Management],
      communication: m.abilities[AbilityName.Communication],
      orientation: m.abilities[AbilityName.Orientation],
      processing: m.abilities[AbilityName.Processing],
      movementEnergy: m.abilities[AbilityName.MovementEnergy],
      imageUrl: m.imageUrl,
    })
  }

  // Seed bonus cards
  console.log(`Inserting ${BONUS_CARDS.length} bonus cards...`)
  for (const card of BONUS_CARDS) {
    await db.insert(bonusCards).values({
      id: card.id,
      name: card.name,
      description: card.description,
      effectType: card.effectType,
      imageUrl: card.imageUrl,
    })
  }

  console.log('Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
