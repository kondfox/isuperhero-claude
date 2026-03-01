import type { Meta, StoryObj } from '@storybook/react'
import { DifficultyBadge } from './DifficultyBadge'

const meta: Meta<typeof DifficultyBadge> = {
  title: 'Components/DifficultyBadge',
  component: DifficultyBadge,
  argTypes: {
    level: {
      control: { type: 'select' },
      options: [1, 2, 3],
    },
  },
}

export default meta
type Story = StoryObj<typeof DifficultyBadge>

export const Level1: Story = {
  args: { level: 1 },
}

export const Level2: Story = {
  args: { level: 2 },
}

export const Level3: Story = {
  args: { level: 3 },
}

export const AllLevels: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <DifficultyBadge level={1} />
      <DifficultyBadge level={2} />
      <DifficultyBadge level={3} />
    </div>
  ),
}
