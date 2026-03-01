import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AbilityName, DifficultyLevel } from '../../types/game-state'
import type { PlayerState } from '../../types/game-state'
import { PlayerList } from './PlayerList'

const emptyAbilities = {
  [AbilityName.Management]: 0,
  [AbilityName.Communication]: 0,
  [AbilityName.Orientation]: 0,
  [AbilityName.Processing]: 0,
  [AbilityName.MovementEnergy]: 0,
}

const mockPlayers: PlayerState[] = [
  {
    id: 'p1',
    name: 'Alice',
    difficultyLevel: DifficultyLevel.Level1,
    abilities: emptyAbilities,
    monstersTamed: [],
    bonusCards: [],
    connected: true,
    ready: true,
  },
  {
    id: 'p2',
    name: 'Bob',
    difficultyLevel: DifficultyLevel.Level2,
    abilities: emptyAbilities,
    monstersTamed: [],
    bonusCards: [],
    connected: true,
    ready: false,
  },
]

describe('PlayerList', () => {
  it('renders all player names', () => {
    render(<PlayerList players={mockPlayers} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows difficulty badges', () => {
    render(<PlayerList players={mockPlayers} />)
    expect(screen.getByText('Lvl 1')).toBeInTheDocument()
    expect(screen.getByText('Lvl 2')).toBeInTheDocument()
  })

  it('shows ready status', () => {
    render(<PlayerList players={mockPlayers} />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('Not Ready')).toBeInTheDocument()
  })

  it('highlights current player with "(You)" label', () => {
    render(<PlayerList players={mockPlayers} myPlayerId="p1" />)
    expect(screen.getByText('(You)')).toBeInTheDocument()
  })

  it('does not show "(You)" when no myPlayerId', () => {
    render(<PlayerList players={mockPlayers} />)
    expect(screen.queryByText('(You)')).not.toBeInTheDocument()
  })

  it('renders empty state when no players', () => {
    render(<PlayerList players={[]} />)
    expect(screen.getByText('No players yet')).toBeInTheDocument()
  })
})
