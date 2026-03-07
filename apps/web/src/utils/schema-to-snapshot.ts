import type { GameSnapshot } from '../types/game-state'

/**
 * Converts a Colyseus Schema state object into a plain GameSnapshot.
 *
 * Colyseus client-side schemas using `defineTypes()` may have a `toJSON()`
 * that returns default/empty values instead of the synced state. We always
 * read properties directly from the schema object to get the real data.
 */
export function schemaToSnapshot(schema: unknown): GameSnapshot {
  if (!schema || typeof schema !== 'object') {
    return emptySnapshot()
  }

  const state = schema as Record<string, unknown>

  return {
    phase: String(state.phase ?? ''),
    players: extractArray(state.players, extractPlayer),
    turnOrder: extractStringArray(state.turnOrder),
    currentTurnIndex: Number(state.currentTurnIndex ?? 0),
    turn: state.turn ? extractTurn(state.turn) : undefined,
    cosmosDeckSize: Number(state.cosmosDeckSize ?? 0),
    eventLog: extractArray(state.eventLog, extractEvent),
    winnerId: String(state.winnerId ?? ''),
    roomSettings: extractRoomSettings(state.roomSettings),
  }
}

function emptySnapshot(): GameSnapshot {
  return {
    phase: '',
    players: [],
    turnOrder: [],
    currentTurnIndex: 0,
    cosmosDeckSize: 0,
    eventLog: [],
    winnerId: '',
    roomSettings: { maxPlayers: 4, taskTimeLimitSeconds: 120, roomName: '', roomCode: '' },
  }
}

function extractArray<T>(source: unknown, mapper: (item: unknown) => T): T[] {
  if (!source) return []
  if (Array.isArray(source)) return source.map(mapper)
  // Colyseus ArraySchema is iterable but not a plain array
  if (typeof source === 'object' && Symbol.iterator in (source as object)) {
    return Array.from(source as Iterable<unknown>, mapper)
  }
  // Object with numeric keys (fallback)
  if (typeof source === 'object') {
    return Object.values(source as Record<string, unknown>).map(mapper)
  }
  return []
}

function extractStringArray(source: unknown): string[] {
  return extractArray(source, (item) => String(item ?? ''))
}

function extractPlayer(raw: unknown): GameSnapshot['players'][number] {
  const p = raw as Record<string, unknown>
  return {
    id: String(p.id ?? ''),
    name: String(p.name ?? ''),
    difficultyLevel: Number(p.difficultyLevel ?? 1),
    abilities: extractAbilities(p.abilities),
    monstersTamed: extractArray(p.monstersTamed, extractMonsterCard),
    bonusCards: extractArray(p.bonusCards, extractBonusCard),
    bonusCardsUsed: Number(p.bonusCardsUsed ?? 0),
    hasBattleAdvantage: Boolean(p.hasBattleAdvantage ?? false),
    hasDefeatImmunity: Boolean(p.hasDefeatImmunity ?? false),
    connected: Boolean(p.connected ?? true),
    ready: Boolean(p.ready ?? false),
  }
}

function extractAbilities(raw: unknown): GameSnapshot['players'][number]['abilities'] {
  const a = (raw ?? {}) as Record<string, unknown>
  return {
    management: Number(a.management ?? 0),
    communication: Number(a.communication ?? 0),
    orientation: Number(a.orientation ?? 0),
    processing: Number(a.processing ?? 0),
    movementEnergy: Number(a.movementEnergy ?? 0),
  }
}

function extractMonsterCard(raw: unknown): {
  id: string
  name: string
  abilities: GameSnapshot['players'][number]['abilities']
  imageUrl: string
} {
  const m = raw as Record<string, unknown>
  return {
    id: String(m.id ?? ''),
    name: String(m.name ?? ''),
    abilities: extractAbilities(m.abilities),
    imageUrl: String(m.imageUrl ?? ''),
  }
}

function extractBonusCard(raw: unknown): {
  id: string
  name: string
  description: string
  effectType: string
  imageUrl: string
} {
  const b = raw as Record<string, unknown>
  return {
    id: String(b.id ?? ''),
    name: String(b.name ?? ''),
    description: String(b.description ?? ''),
    effectType: String(b.effectType ?? ''),
    imageUrl: String(b.imageUrl ?? ''),
  }
}

function extractRoomSettings(raw: unknown): GameSnapshot['roomSettings'] {
  const s = (raw ?? {}) as Record<string, unknown>
  return {
    maxPlayers: Number(s.maxPlayers ?? 4),
    taskTimeLimitSeconds: Number(s.taskTimeLimitSeconds ?? 120),
    roomName: String(s.roomName ?? ''),
    roomCode: String(s.roomCode ?? ''),
  }
}

function extractTurn(raw: unknown): GameSnapshot['turn'] {
  const t = raw as Record<string, unknown>
  return {
    activePlayerId: String(t.activePlayerId ?? ''),
    phase: String(t.phase ?? ''),
    chosenAction: t.chosenAction ? String(t.chosenAction) : undefined,
    chosenAbility: t.chosenAbility ? String(t.chosenAbility) : undefined,
    dieRoll: t.dieRoll ? extractDieRoll(t.dieRoll) : undefined,
    currentTask: t.currentTask ? extractTask(t.currentTask) : undefined,
    drawnMonster: t.drawnMonster ? extractMonsterCard(t.drawnMonster) : undefined,
    drawnBonus: t.drawnBonus ? extractBonusCard(t.drawnBonus) : undefined,
    drawnCardType: t.drawnCardType ? String(t.drawnCardType) : undefined,
    battleResult: t.battleResult ? extractBattleResult(t.battleResult) : undefined,
  }
}

function extractDieRoll(raw: unknown): {
  taskNumber: number
  wasRerolled: boolean
  rerollCount: number
} {
  const d = raw as Record<string, unknown>
  return {
    taskNumber: Number(d.taskNumber ?? 0),
    wasRerolled: Boolean(d.wasRerolled ?? false),
    rerollCount: Number(d.rerollCount ?? 0),
  }
}

function extractTask(raw: unknown): NonNullable<NonNullable<GameSnapshot['turn']>['currentTask']> {
  const t = raw as Record<string, unknown>
  return {
    id: String(t.id ?? ''),
    abilityName: String(t.abilityName ?? ''),
    taskNumber: Number(t.taskNumber ?? 0),
    rewards: extractStringArray(t.rewards),
    taskType: String(t.taskType ?? ''),
    title: String(t.title ?? ''),
    instructions: String(t.instructions ?? ''),
    requirements: String(t.requirements ?? ''),
  }
}

function extractMapEntries(source: unknown): Array<[string, unknown]> {
  if (!source || typeof source !== 'object') return []
  // Colyseus MapSchema has a forEach(callback, thisArg) method
  const map = source as { forEach?: (cb: (val: unknown, key: string) => void) => void }
  if (typeof map.forEach === 'function') {
    const entries: Array<[string, unknown]> = []
    map.forEach((val: unknown, key: string) => {
      entries.push([key, val])
    })
    return entries
  }
  return Object.entries(source as Record<string, unknown>)
}

function extractBattleResult(
  raw: unknown,
): NonNullable<NonNullable<GameSnapshot['turn']>['battleResult']> {
  const b = raw as Record<string, unknown>
  const comparisons: Record<
    string,
    { playerScore: number; monsterScore: number; playerWins: boolean }
  > = {}
  if (b.comparisons && typeof b.comparisons === 'object') {
    for (const [key, val] of extractMapEntries(b.comparisons)) {
      const c = val as Record<string, unknown>
      comparisons[key] = {
        playerScore: Number(c.playerScore ?? 0),
        monsterScore: Number(c.monsterScore ?? 0),
        playerWins: Boolean(c.playerWins ?? false),
      }
    }
  }
  return { victory: Boolean(b.victory ?? false), comparisons }
}

function extractEvent(raw: unknown): GameSnapshot['eventLog'][number] {
  const e = raw as Record<string, unknown>
  return {
    id: String(e.id ?? ''),
    timestamp: Number(e.timestamp ?? 0),
    playerId: String(e.playerId ?? ''),
    message: String(e.message ?? ''),
    type: String(e.type ?? '') as GameSnapshot['eventLog'][number]['type'],
  }
}
