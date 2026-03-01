import { AbilityName, DifficultyLevel } from '@isuperhero/types'
import { describe, expect, it } from 'vitest'
import { applyTaskRewards, decreaseAbility, increaseAbility } from './ability'
import { MAX_ABILITY_SCORE } from './constants'
import { createPlayer } from './create-game'

function makePlayer(overrides: Partial<Record<AbilityName, number>> = {}) {
  const player = createPlayer('p1', 'Alice', DifficultyLevel.Level1)
  return {
    ...player,
    abilities: { ...player.abilities, ...overrides },
  }
}

describe('increaseAbility', () => {
  it('increases ability by 1 by default', () => {
    const player = makePlayer()
    const result = increaseAbility(player, AbilityName.Management)
    expect(result.abilities[AbilityName.Management]).toBe(1)
  })

  it('increases ability by specified amount', () => {
    const player = makePlayer()
    const result = increaseAbility(player, AbilityName.Management, 3)
    expect(result.abilities[AbilityName.Management]).toBe(3)
  })

  it('clamps at MAX_ABILITY_SCORE', () => {
    const player = makePlayer({ [AbilityName.Management]: 4 })
    const result = increaseAbility(player, AbilityName.Management, 3)
    expect(result.abilities[AbilityName.Management]).toBe(MAX_ABILITY_SCORE)
  })

  it('does not mutate original player', () => {
    const player = makePlayer()
    increaseAbility(player, AbilityName.Management)
    expect(player.abilities[AbilityName.Management]).toBe(0)
  })

  it('does not affect other abilities', () => {
    const player = makePlayer()
    const result = increaseAbility(player, AbilityName.Management)
    expect(result.abilities[AbilityName.Communication]).toBe(0)
    expect(result.abilities[AbilityName.Orientation]).toBe(0)
  })
})

describe('decreaseAbility', () => {
  it('decreases ability by 1 by default', () => {
    const player = makePlayer({ [AbilityName.Management]: 3 })
    const result = decreaseAbility(player, AbilityName.Management)
    expect(result.abilities[AbilityName.Management]).toBe(2)
  })

  it('decreases ability by specified amount', () => {
    const player = makePlayer({ [AbilityName.Management]: 3 })
    const result = decreaseAbility(player, AbilityName.Management, 2)
    expect(result.abilities[AbilityName.Management]).toBe(1)
  })

  it('clamps at 0', () => {
    const player = makePlayer({ [AbilityName.Management]: 1 })
    const result = decreaseAbility(player, AbilityName.Management, 3)
    expect(result.abilities[AbilityName.Management]).toBe(0)
  })

  it('does not go below 0 from 0', () => {
    const player = makePlayer()
    const result = decreaseAbility(player, AbilityName.Management)
    expect(result.abilities[AbilityName.Management]).toBe(0)
  })
})

describe('applyTaskRewards', () => {
  it('increases all reward abilities by 1', () => {
    const player = makePlayer()
    const result = applyTaskRewards(player, [AbilityName.Management, AbilityName.Processing])
    expect(result.abilities[AbilityName.Management]).toBe(1)
    expect(result.abilities[AbilityName.Processing]).toBe(1)
  })

  it('clamps each ability independently', () => {
    const player = makePlayer({
      [AbilityName.Management]: MAX_ABILITY_SCORE,
      [AbilityName.Processing]: 4,
    })
    const result = applyTaskRewards(player, [AbilityName.Management, AbilityName.Processing])
    expect(result.abilities[AbilityName.Management]).toBe(MAX_ABILITY_SCORE)
    expect(result.abilities[AbilityName.Processing]).toBe(MAX_ABILITY_SCORE)
  })

  it('does not affect unrewarded abilities', () => {
    const player = makePlayer()
    const result = applyTaskRewards(player, [AbilityName.Management, AbilityName.Processing])
    expect(result.abilities[AbilityName.Communication]).toBe(0)
    expect(result.abilities[AbilityName.Orientation]).toBe(0)
    expect(result.abilities[AbilityName.MovementEnergy]).toBe(0)
  })

  it('does not mutate original player', () => {
    const player = makePlayer()
    applyTaskRewards(player, [AbilityName.Management, AbilityName.Processing])
    expect(player.abilities[AbilityName.Management]).toBe(0)
    expect(player.abilities[AbilityName.Processing]).toBe(0)
  })

  it('handles empty rewards array', () => {
    const player = makePlayer({ [AbilityName.Management]: 2 })
    const result = applyTaskRewards(player, [])
    expect(result.abilities[AbilityName.Management]).toBe(2)
  })

  it('handles single reward', () => {
    const player = makePlayer()
    const result = applyTaskRewards(player, [AbilityName.Orientation])
    expect(result.abilities[AbilityName.Orientation]).toBe(1)
  })
})
