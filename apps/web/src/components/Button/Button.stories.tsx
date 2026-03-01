import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    size: {
      control: 'select',
      options: ['default', 'large'],
    },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    children: 'Button',
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Create Room',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Join Room',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Leave Game',
  },
}

export const Large: Story = {
  args: {
    size: 'large',
    children: 'Start Game',
  },
}

export const LargeSecondary: Story = {
  args: {
    variant: 'secondary',
    size: 'large',
    children: 'Join Room',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Waiting...',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button size="default">Default</Button>
      <Button size="large">Large</Button>
    </div>
  ),
}

export const AsLink: Story = {
  render: () => (
    <Button asChild variant="primary">
      <a href="/">Link styled as button</a>
    </Button>
  ),
}
