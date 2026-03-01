import {
  type AbilityName,
  type DifficultyLevel,
  GamePhase,
  type GameState,
  type PlayerId,
  type TurnPhase,
} from '@isuperhero/types'
import { ALL_ABILITIES } from './constants'

export function isActivePlayer(state: GameState, playerId: PlayerId): boolean {
  return state.turn?.activePlayerId === playerId
}

export function isValidPhase(state: GameState, expectedPhase: TurnPhase): boolean {
  return state.turn?.phase === expectedPhase
}

export function canPlayerAct(
  state: GameState,
  playerId: PlayerId,
  expectedPhase: TurnPhase,
): boolean {
  return (
    state.phase === GamePhase.InProgress &&
    isActivePlayer(state, playerId) &&
    isValidPhase(state, expectedPhase)
  )
}

export function isValidAbilityChoice(ability: string): ability is AbilityName {
  return ALL_ABILITIES.includes(ability as AbilityName)
}

export function isValidDifficultyLevel(level: number): level is DifficultyLevel {
  return level === 1 || level === 2 || level === 3
}
