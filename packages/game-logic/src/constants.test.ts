import { AbilityName } from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import {
  ALL_ABILITIES,
  DIE_SIDES,
  MAX_ABILITY_SCORE,
  MAX_PLAYERS,
  MIN_ABILITY_SCORE,
  MIN_PLAYERS,
  MONSTERS_TO_WIN,
  RELATED_ABILITIES,
} from './constants'

describe('constants', () => {
  it('defines correct ability score bounds', () => {
    expect(MIN_ABILITY_SCORE).toBe(0)
    expect(MAX_ABILITY_SCORE).toBe(5)
  })

  it('defines correct die sides', () => {
    expect(DIE_SIDES).toBe(20)
  })

  it('defines correct win condition', () => {
    expect(MONSTERS_TO_WIN).toBe(3)
  })

  it('defines correct player count bounds', () => {
    expect(MIN_PLAYERS).toBe(2)
    expect(MAX_PLAYERS).toBe(4)
  })

  it('lists all 5 abilities', () => {
    expect(ALL_ABILITIES).toHaveLength(5)
    expect(ALL_ABILITIES).toContain(AbilityName.Management)
    expect(ALL_ABILITIES).toContain(AbilityName.Communication)
    expect(ALL_ABILITIES).toContain(AbilityName.Orientation)
    expect(ALL_ABILITIES).toContain(AbilityName.Processing)
    expect(ALL_ABILITIES).toContain(AbilityName.MovementEnergy)
  })

  it('defines related abilities for every ability', () => {
    for (const ability of ALL_ABILITIES) {
      expect(RELATED_ABILITIES[ability]).toBeDefined()
      expect(RELATED_ABILITIES[ability].length).toBeGreaterThanOrEqual(1)
    }
  })

  it('never includes self in related abilities', () => {
    for (const ability of ALL_ABILITIES) {
      expect(RELATED_ABILITIES[ability]).not.toContain(ability)
    }
  })

  it('only references valid abilities in related map', () => {
    for (const ability of ALL_ABILITIES) {
      for (const related of RELATED_ABILITIES[ability]) {
        expect(ALL_ABILITIES).toContain(related)
      }
    }
  })
})
