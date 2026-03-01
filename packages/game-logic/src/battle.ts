import type { AbilityName, BattleResult, MonsterCard, PlayerState } from '@isuperhero/types'
import { decreaseAbility } from './ability'
import { ALL_ABILITIES } from './constants'

export function resolveBattle(player: PlayerState, monster: MonsterCard): BattleResult {
  const comparisons = {} as BattleResult['comparisons']
  let victory = true

  for (const ability of ALL_ABILITIES) {
    const playerScore = player.abilities[ability]
    const monsterScore = monster.abilities[ability]
    const playerWins = playerScore > monsterScore
    comparisons[ability] = { playerScore, monsterScore, playerWins }
    if (!playerWins) {
      victory = false
    }
  }

  return { victory, comparisons }
}

export function applyBattleVictory(player: PlayerState, monster: MonsterCard): PlayerState {
  return {
    ...player,
    monstersTamed: [...player.monstersTamed, monster],
  }
}

export function applyBattleDefeat(player: PlayerState, ability: AbilityName): PlayerState {
  return decreaseAbility(player, ability)
}
