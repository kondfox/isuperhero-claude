import type { BonusCard } from '@isuperhero/types'

/**
 * 10 unique bonus card types.
 * The cosmos deck contains multiple copies of some cards (see BONUS_DECK_DISTRIBUTION).
 * Effect logic is NOT implemented yet — cards are stored in player's hand for display only.
 */
export const BONUS_CARDS: BonusCard[] = [
  {
    id: 'supergame',
    name: 'Суперигра',
    description: 'Бросай кубик ещё раз, выполни задание и получи дополнительные очки',
    effectType: 'extraTurn',
    imageUrl: '/images/bonuses/supergame.png',
  },
  {
    id: 'bonus1',
    name: 'Бонус: Управление',
    description: '+1 к Управлению',
    effectType: 'boostManagement',
    imageUrl: '/images/bonuses/bonus1.png',
  },
  {
    id: 'bonus2',
    name: 'Бонус: Выбор',
    description: '+1 к любой способности (игрок выбирает)',
    effectType: 'boostChoice',
    imageUrl: '/images/bonuses/bonus2.png',
  },
  {
    id: 'bonus3',
    name: 'Бонус: Ориентация',
    description: '+1 к Ориентации',
    effectType: 'boostOrientation',
    imageUrl: '/images/bonuses/bonus3.png',
  },
  {
    id: 'bonus4',
    name: 'Бонус: Переработка',
    description: '+1 к Переработке',
    effectType: 'boostProcessing',
    imageUrl: '/images/bonuses/bonus4.png',
  },
  {
    id: 'bonus5',
    name: 'Бонус: Связь',
    description: '+1 к Связи',
    effectType: 'boostCommunication',
    imageUrl: '/images/bonuses/bonus5.png',
  },
  {
    id: 'bonus6',
    name: 'Бонус: Движение-Энергия',
    description: '+1 к Движению-Энергии',
    effectType: 'boostMovementEnergy',
    imageUrl: '/images/bonuses/bonus6.png',
  },
  {
    id: 'bonus7',
    name: 'Преимущество в бою',
    description: 'Выиграй бой с монстром при 4 из 5 способностей (вместо 5 из 5)',
    effectType: 'battleAdvantage',
    imageUrl: '/images/bonuses/bonus7.png',
  },
  {
    id: 'bonus8',
    name: 'Иммунитет от поражения',
    description: 'Не теряй способность при проигрыше монстру',
    effectType: 'defeatImmunity',
    imageUrl: '/images/bonuses/bonus8.png',
  },
  {
    id: 'bonus9',
    name: 'Иммунитет + цепочка',
    description: 'Не теряй способность при проигрыше + тяни следующую карту космоса',
    effectType: 'defeatImmunityChain',
    imageUrl: '/images/bonuses/bonus9.png',
  },
]

/**
 * Cosmos deck composition: each monster card appears once (40 total),
 * plus bonus cards in these quantities. Total: 40 + 25 = 65 cards.
 * Source: isuperhero-next/constants/cards.js
 *
 * Note: image IDs in source code differ from our IDs.
 * supergame (10) = our "supergame" (extraTurn)
 * bonus1-bonus10 (15 total) = our bonus1-bonus9 cards
 * Exact image-to-effect mapping TBD when implementing cosmos deck.
 */
export const COSMOS_DECK_BONUS_COUNT = 25
