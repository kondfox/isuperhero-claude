import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DifficultyBadge } from './DifficultyBadge'

describe('DifficultyBadge', () => {
  it('renders level 1 text', () => {
    render(<DifficultyBadge level={1} />)
    expect(screen.getByText('Lvl 1')).toBeInTheDocument()
  })

  it('renders level 2 text', () => {
    render(<DifficultyBadge level={2} />)
    expect(screen.getByText('Lvl 2')).toBeInTheDocument()
  })

  it('renders level 3 text', () => {
    render(<DifficultyBadge level={3} />)
    expect(screen.getByText('Lvl 3')).toBeInTheDocument()
  })

  it('has role of status', () => {
    render(<DifficultyBadge level={1} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
