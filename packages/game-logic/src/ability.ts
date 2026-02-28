import type { AbilityName, PlayerState } from "@isuperhero/types";
import { MAX_ABILITY_SCORE, MIN_ABILITY_SCORE, RELATED_ABILITIES } from "./constants";

export function increaseAbility(
  player: PlayerState,
  ability: AbilityName,
  amount = 1,
): PlayerState {
  const current = player.abilities[ability];
  const newValue = Math.min(current + amount, MAX_ABILITY_SCORE);
  return {
    ...player,
    abilities: { ...player.abilities, [ability]: newValue },
  };
}

export function decreaseAbility(
  player: PlayerState,
  ability: AbilityName,
  amount = 1,
): PlayerState {
  const current = player.abilities[ability];
  const newValue = Math.max(current - amount, MIN_ABILITY_SCORE);
  return {
    ...player,
    abilities: { ...player.abilities, [ability]: newValue },
  };
}

export function getValidRelatedAbilities(
  player: PlayerState,
  primaryAbility: AbilityName,
): AbilityName[] {
  return RELATED_ABILITIES[primaryAbility].filter(
    (ability) => player.abilities[ability] < MAX_ABILITY_SCORE,
  );
}

export function applyTaskSuccess(
  player: PlayerState,
  primaryAbility: AbilityName,
  relatedAbility: AbilityName,
): PlayerState {
  const validRelated = RELATED_ABILITIES[primaryAbility];
  if (!validRelated.includes(relatedAbility)) {
    throw new Error(`${relatedAbility} is not a valid related ability for ${primaryAbility}`);
  }
  let result = increaseAbility(player, primaryAbility);
  result = increaseAbility(result, relatedAbility);
  return result;
}
