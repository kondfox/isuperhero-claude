import { AbilityName } from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { MONSTERS } from './monsters'

describe('MONSTERS', () => {
  it('contains exactly 40 monsters', () => {
    expect(MONSTERS).toHaveLength(40)
  })

  it('each monster has a unique id', () => {
    const ids = MONSTERS.map((m) => m.id)
    expect(new Set(ids).size).toBe(40)
  })

  it('each monster has a name', () => {
    for (const m of MONSTERS) {
      expect(m.name).toBeTruthy()
    }
  })

  it('each monster has an imageUrl', () => {
    for (const m of MONSTERS) {
      expect(m.imageUrl).toMatch(/\.png$/)
    }
  })

  it('each monster has all 5 ability scores', () => {
    const abilityNames = Object.values(AbilityName)
    for (const m of MONSTERS) {
      for (const ability of abilityNames) {
        expect(m.abilities[ability]).toBeGreaterThanOrEqual(0)
        expect(m.abilities[ability]).toBeLessThanOrEqual(5)
      }
    }
  })

  it('first monster is boyaka', () => {
    expect(MONSTERS[0].id).toBe('boyaka')
    expect(MONSTERS[0].name).toBe('Бояка')
  })

  it('last monster is zljuka', () => {
    expect(MONSTERS[39].id).toBe('zljuka')
    expect(MONSTERS[39].name).toBe('Злюка')
  })

  it('lipkij has all zeros (weakest monster)', () => {
    const lipkij = MONSTERS.find((m) => m.id === 'lipkij')!
    expect(lipkij.abilities[AbilityName.Management]).toBe(0)
    expect(lipkij.abilities[AbilityName.Communication]).toBe(0)
    expect(lipkij.abilities[AbilityName.Orientation]).toBe(0)
    expect(lipkij.abilities[AbilityName.Processing]).toBe(0)
    expect(lipkij.abilities[AbilityName.MovementEnergy]).toBe(0)
  })
})
