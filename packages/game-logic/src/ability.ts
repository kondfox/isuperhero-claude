import type { AbilityName, PlayerState } from '@isuperhero/types'
import { MAX_ABILITY_SCORE, MIN_ABILITY_SCORE } from './constants'

export function increaseAbility(
  player: PlayerState,
  ability: AbilityName,
  amount = 1,
): PlayerState {
  const current = player.abilities[ability]
  const newValue = Math.min(current + amount, MAX_ABILITY_SCORE)
  return {
    ...player,
    abilities: { ...player.abilities, [ability]: newValue },
  }
}

export function decreaseAbility(
  player: PlayerState,
  ability: AbilityName,
  amount = 1,
): PlayerState {
  const current = player.abilities[ability]
  const newValue = Math.max(current - amount, MIN_ABILITY_SCORE)
  return {
    ...player,
    abilities: { ...player.abilities, [ability]: newValue },
  }
}

export function applyTaskRewards(player: PlayerState, rewards: AbilityName[]): PlayerState {
  let result = player
  for (const ability of rewards) {
    result = increaseAbility(result, ability)
  }
  return result
}
