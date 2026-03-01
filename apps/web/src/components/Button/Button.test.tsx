import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

afterEach(cleanup)

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDefined()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Press</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('primary')
  })

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('secondary')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">Danger</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('danger')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders as child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Link Button' })
    expect(link).toBeDefined()
    expect(link.tagName).toBe('A')
  })
})
