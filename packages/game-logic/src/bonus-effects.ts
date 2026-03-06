import { type BonusCardParams, BonusEffect, type GameState, type PlayerId } from '@isuperhero/types'
import { increaseAbility } from './ability'

export function applyBonusCardEffect(
  state: GameState,
  playerId: PlayerId,
  cardId: string,
  params?: BonusCardParams,
): GameState {
  const player = state.players.find((p) => p.id === playerId)
  if (!player) {
    throw new Error('Player not found')
  }

  const card = player.bonusCards.find((c) => c.id === cardId)
  if (!card) {
    throw new Error('Card not found in player hand')
  }

  const effect = card.effectType as BonusEffect
  let updatedPlayer = {
    ...player,
    bonusCards: player.bonusCards.filter((c) => c.id !== cardId),
    bonusCardsUsed: player.bonusCardsUsed + 1,
  }

  switch (effect) {
    case BonusEffect.ExtraRoll: {
      updatedPlayer = { ...updatedPlayer, hasExtraRoll: true }
      break
    }
    case BonusEffect.AbilityBoost: {
      if (!params?.ability) {
        throw new Error('AbilityBoost requires an ability parameter')
      }
      updatedPlayer = increaseAbility(updatedPlayer, params.ability)
      break
    }
    case BonusEffect.Shield: {
      updatedPlayer = { ...updatedPlayer, hasShield: true }
      break
    }
    case BonusEffect.Swap: {
      if (!params?.swapFrom || !params?.swapTo) {
        throw new Error('Swap requires swapFrom and swapTo parameters')
      }
      const fromValue = updatedPlayer.abilities[params.swapFrom]
      const toValue = updatedPlayer.abilities[params.swapTo]
      updatedPlayer = {
        ...updatedPlayer,
        abilities: {
          ...updatedPlayer.abilities,
          [params.swapFrom]: toValue,
          [params.swapTo]: fromValue,
        },
      }
      break
    }
    default:
      throw new Error(`Unknown bonus effect: ${effect}`)
  }

  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? updatedPlayer : p)),
  }
}
