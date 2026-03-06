import type { GameState, GameSummary, PlayerId, PlayerState } from '@isuperhero/types'
import { ALL_ABILITIES, MONSTERS_TO_WIN } from './constants'

export function checkWinCondition(player: PlayerState): boolean {
  return player.monstersTamed.length >= MONSTERS_TO_WIN
}

export function checkGameOver(state: GameState): PlayerId | null {
  for (const player of state.players) {
    if (checkWinCondition(player)) {
      return player.id
    }
  }
  return null
}

export function getGameSummary(state: GameState): GameSummary {
  if (!state.winnerId) {
    throw new Error('No winner — game is not finished')
  }

  const winner = state.players.find((p) => p.id === state.winnerId)
  if (!winner) {
    throw new Error('Winner not found in players')
  }

  const playerRankings = state.players
    .map((p) => {
      const totalAbilityScore = ALL_ABILITIES.reduce((sum, a) => sum + p.abilities[a], 0)
      return {
        playerId: p.id,
        name: p.name,
        monstersCount: p.monstersTamed.length,
        totalAbilityScore,
        bonusCardsUsed: p.bonusCardsUsed,
      }
    })
    .sort((a, b) => {
      if (b.monstersCount !== a.monstersCount) return b.monstersCount - a.monstersCount
      return b.totalAbilityScore - a.totalAbilityScore
    })

  return {
    winnerId: state.winnerId,
    winnerName: winner.name,
    playerRankings,
    totalTurns: state.currentTurnIndex,
  }
}
