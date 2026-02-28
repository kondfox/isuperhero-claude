import { type BonusCard, CardType, type MonsterCard } from "@isuperhero/types";

export interface DrawCardResult {
  card: MonsterCard | BonusCard;
  cardType: CardType;
  remainingDeck: Array<MonsterCard | BonusCard>;
}

export function isMonsterCard(card: MonsterCard | BonusCard): card is MonsterCard {
  return "abilities" in card;
}

export function getCardType(card: MonsterCard | BonusCard): CardType {
  return isMonsterCard(card) ? CardType.Monster : CardType.Bonus;
}

export function drawCard(deck: Array<MonsterCard | BonusCard>): DrawCardResult | null {
  if (deck.length === 0) {
    return null;
  }
  const [card, ...remainingDeck] = deck;
  return {
    card,
    cardType: getCardType(card),
    remainingDeck,
  };
}

export function shuffleDeck<T>(items: readonly T[], randomFn: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
