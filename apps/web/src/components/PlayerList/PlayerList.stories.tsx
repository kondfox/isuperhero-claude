import { AbilityName, DifficultyLevel } from '@isuperhero/types'
import type { Meta, StoryObj } from '@storybook/react'
import type { PlayerState } from '../../types/game-state'
import { PlayerList } from './PlayerList'

const emptyAbilities = {
  [AbilityName.Management]: 0,
  [AbilityName.Communication]: 0,
  [AbilityName.Orientation]: 0,
  [AbilityName.Processing]: 0,
  [AbilityName.MovementEnergy]: 0,
}

const samplePlayers: PlayerState[] = [
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
  {
    id: 'p3',
    name: 'Charlie',
    difficultyLevel: DifficultyLevel.Level3,
    abilities: emptyAbilities,
    monstersTamed: [],
    bonusCards: [],
    connected: true,
    ready: true,
  },
]

const meta: Meta<typeof PlayerList> = {
  title: 'Components/PlayerList',
  component: PlayerList,
}

export default meta
type Story = StoryObj<typeof PlayerList>

export const Default: Story = {
  args: {
    players: samplePlayers,
  },
}

export const WithCurrentPlayer: Story = {
  args: {
    players: samplePlayers,
    myPlayerId: 'p1',
  },
}

export const AllReady: Story = {
  args: {
    players: samplePlayers.map((p) => ({ ...p, ready: true })),
    myPlayerId: 'p2',
  },
}

export const Empty: Story = {
  args: {
    players: [],
  },
}

export const SinglePlayer: Story = {
  args: {
    players: [samplePlayers[0]],
    myPlayerId: 'p1',
  },
}
