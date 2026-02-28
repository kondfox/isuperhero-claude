import { AbilityName } from "@isuperhero/types";

export const MAX_ABILITY_SCORE = 5;
export const MIN_ABILITY_SCORE = 0;
export const DIE_SIDES = 20;
export const MONSTERS_TO_WIN = 3;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

export const ALL_ABILITIES: readonly AbilityName[] = [
  AbilityName.Management,
  AbilityName.Communication,
  AbilityName.Orientation,
  AbilityName.Processing,
  AbilityName.MovementEnergy,
] as const;

export const RELATED_ABILITIES: Record<AbilityName, readonly AbilityName[]> = {
  [AbilityName.Management]: [AbilityName.Processing, AbilityName.Communication],
  [AbilityName.Communication]: [AbilityName.Management, AbilityName.Orientation],
  [AbilityName.Orientation]: [AbilityName.MovementEnergy, AbilityName.Processing],
  [AbilityName.Processing]: [AbilityName.Management, AbilityName.Orientation],
  [AbilityName.MovementEnergy]: [AbilityName.Orientation, AbilityName.Processing],
};
