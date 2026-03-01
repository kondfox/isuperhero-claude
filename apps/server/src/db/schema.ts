import { integer, jsonb, pgTable, smallint, text, varchar } from 'drizzle-orm/pg-core'

export const tasks = pgTable('tasks', {
  id: varchar('id', { length: 64 }).primaryKey(),
  abilityName: varchar('ability_name', { length: 32 }).notNull(),
  taskNumber: smallint('task_number').notNull(),
  title: jsonb('title').notNull().$type<Record<string, string>>(),
  rewards: jsonb('rewards').notNull().$type<string[]>(),
  requirements: jsonb('requirements').$type<Record<string, string>>(),
  levels: jsonb('levels').notNull().$type<Record<string, Record<string, string>>>(),
  imageRefs: jsonb('image_refs').$type<string[]>(),
  taskType: varchar('task_type', { length: 32 }).notNull(),
})

export const monsters = pgTable('monsters', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  management: smallint('management').notNull().default(0),
  communication: smallint('communication').notNull().default(0),
  orientation: smallint('orientation').notNull().default(0),
  processing: smallint('processing').notNull().default(0),
  movementEnergy: smallint('movement_energy').notNull().default(0),
  imageUrl: varchar('image_url', { length: 256 }).notNull(),
})

export const bonusCards = pgTable('bonus_cards', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  description: text('description').notNull(),
  effectType: varchar('effect_type', { length: 64 }).notNull(),
  imageUrl: varchar('image_url', { length: 256 }).notNull(),
  deckCount: integer('deck_count').notNull().default(1),
})
