import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

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

// --- Player accounts & game history ---

export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    displayName: varchar('display_name', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).unique(),
    passwordHash: varchar('password_hash', { length: 255 }),
    isActivated: boolean('is_activated').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique('players_display_name_unique').on(t.displayName)],
)

export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  playerId: uuid('player_id')
    .references(() => players.id, { onDelete: 'cascade' })
    .notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const gameRecords = pgTable('game_records', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  roomCode: varchar('room_code', { length: 10 }).notNull(),
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at'),
  winnerId: uuid('winner_id').references(() => players.id),
  totalTurns: integer('total_turns'),
  settings: jsonb('settings').notNull().default({}),
})

export const gameParticipants = pgTable(
  'game_participants',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    gameId: uuid('game_id')
      .references(() => gameRecords.id, { onDelete: 'cascade' })
      .notNull(),
    playerId: uuid('player_id')
      .references(() => players.id)
      .notNull(),
    finalRank: integer('final_rank'),
    monstersTamed: integer('monsters_tamed').default(0),
    totalAbilityScore: integer('total_ability_score').default(0),
    bonusCardsUsed: integer('bonus_cards_used').default(0),
  },
  (t) => [unique('game_participants_game_player_unique').on(t.gameId, t.playerId)],
)
