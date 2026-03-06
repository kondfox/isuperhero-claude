import {
  AbilityName,
  type AbilityScores,
  type DifficultyLevel,
  GamePhase,
  type GameState,
  type PlayerId,
  type PlayerState,
  type RoomSettings,
  TurnPhase,
} from '@isuperhero/types'
import { MIN_PLAYERS } from './constants'

export function createInitialAbilities(): AbilityScores {
  return {
    [AbilityName.Management]: 0,
    [AbilityName.Communication]: 0,
    [AbilityName.Orientation]: 0,
    [AbilityName.Processing]: 0,
    [AbilityName.MovementEnergy]: 0,
  }
}

export function createPlayer(
  id: PlayerId,
  name: string,
  difficultyLevel: DifficultyLevel,
): PlayerState {
  return {
    id,
    name,
    difficultyLevel,
    abilities: createInitialAbilities(),
    monstersTamed: [],
    bonusCards: [],
    bonusCardsUsed: 0,
    hasExtraRoll: false,
    hasShield: false,
    connected: true,
    ready: false,
  }
}

export function createGameState(settings: RoomSettings): GameState {
  return {
    phase: GamePhase.WaitingForPlayers,
    players: [],
    turnOrder: [],
    currentTurnIndex: 0,
    turn: null,
    rolledTasks: {},
    cosmosDeck: [],
    discardPile: [],
    eventLog: [],
    winnerId: null,
    roomSettings: settings,
  }
}

export function addPlayerToGame(state: GameState, player: PlayerState): GameState {
  if (state.phase !== GamePhase.WaitingForPlayers) {
    throw new Error('Cannot add players after game has started')
  }
  if (state.players.length >= state.roomSettings.maxPlayers) {
    throw new Error(`Room is full (max ${state.roomSettings.maxPlayers} players)`)
  }
  if (state.players.some((p) => p.id === player.id)) {
    throw new Error(`Player ${player.id} is already in the game`)
  }
  return {
    ...state,
    players: [...state.players, player],
  }
}

export function removePlayerFromGame(state: GameState, playerId: PlayerId): GameState {
  if (!state.players.some((p) => p.id === playerId)) {
    throw new Error(`Player ${playerId} is not in the game`)
  }
  return {
    ...state,
    players: state.players.filter((p) => p.id !== playerId),
    turnOrder: state.turnOrder.filter((id) => id !== playerId),
  }
}

export function startGame(state: GameState): GameState {
  if (state.phase !== GamePhase.WaitingForPlayers) {
    throw new Error('Game has already started')
  }
  if (state.players.length < MIN_PLAYERS) {
    throw new Error(`Need at least ${MIN_PLAYERS} players to start`)
  }
  if (!state.players.every((p) => p.ready)) {
    throw new Error('All players must be ready to start')
  }

  const turnOrder = state.players.map((p) => p.id)
  return {
    ...state,
    phase: GamePhase.InProgress,
    turnOrder,
    currentTurnIndex: 0,
    turn: {
      activePlayerId: turnOrder[0],
      phase: TurnPhase.ChoosingAction,
    },
  }
}
