import { AbilityName } from '@isuperhero/types'

export const MAX_ABILITY_SCORE = 5
export const MIN_ABILITY_SCORE = 0
export const DIE_SIDES = 20
export const MONSTERS_TO_WIN = 3
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 4

export const ALL_ABILITIES: readonly AbilityName[] = [
  AbilityName.Management,
  AbilityName.Communication,
  AbilityName.Orientation,
  AbilityName.Processing,
  AbilityName.MovementEnergy,
] as const
