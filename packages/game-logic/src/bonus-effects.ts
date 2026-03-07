import {
  AbilityName,
  type BonusCardParams,
  BonusEffect,
  type GameState,
  type PlayerId,
} from '@isuperhero/types'
import { increaseAbility } from './ability'

const BOOST_TO_ABILITY: Partial<Record<BonusEffect, AbilityName>> = {
  [BonusEffect.BoostManagement]: AbilityName.Management,
  [BonusEffect.BoostCommunication]: AbilityName.Communication,
  [BonusEffect.BoostOrientation]: AbilityName.Orientation,
  [BonusEffect.BoostProcessing]: AbilityName.Processing,
  [BonusEffect.BoostMovementEnergy]: AbilityName.MovementEnergy,
}

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
  // Remove only the first card with this ID (not all copies)
  const cardIndex = player.bonusCards.findIndex((c) => c.id === cardId)
  const remainingCards = [...player.bonusCards]
  remainingCards.splice(cardIndex, 1)

  let updatedPlayer = {
    ...player,
    bonusCards: remainingCards,
    bonusCardsUsed: player.bonusCardsUsed + 1,
  }

  // Specific ability boost cards
  const boostAbility = BOOST_TO_ABILITY[effect]
  if (boostAbility) {
    updatedPlayer = increaseAbility(updatedPlayer, boostAbility)
    return replacePlayer(state, playerId, updatedPlayer)
  }

  switch (effect) {
    case BonusEffect.BoostChoice: {
      if (!params?.ability) {
        throw new Error('BoostChoice requires an ability parameter')
      }
      updatedPlayer = increaseAbility(updatedPlayer, params.ability)
      break
    }
    case BonusEffect.BattleAdvantage: {
      updatedPlayer = { ...updatedPlayer, hasBattleAdvantage: true }
      break
    }
    case BonusEffect.DefeatImmunity:
    case BonusEffect.DefeatImmunityChain: {
      updatedPlayer = { ...updatedPlayer, hasDefeatImmunity: true }
      break
    }
    case BonusEffect.ExtraTurn: {
      // Card is consumed; extra turn logic handled by the room
      break
    }
    default:
      throw new Error(`Unknown bonus effect: ${effect}`)
  }

  return replacePlayer(state, playerId, updatedPlayer)
}

function replacePlayer(state: GameState, playerId: PlayerId, updated: GameState['players'][0]) {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? updated : p)),
  }
}
