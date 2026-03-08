import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, buttonVariants } from './button'

describe('Button', () => {
  it('should render button with default props', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
  })

  it('should render button with different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<Button variant="destructive">Destructive</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<Button variant="link">Link</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should render button with different sizes', () => {
    const { rerender } = render(<Button size="default">Default</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<Button size="icon">Icon</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>)

    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('should render as child when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )

    expect(screen.getByRole('link')).toBeInTheDocument()
    expect(screen.getByText('Link Button')).toBeInTheDocument()
  })

  it('should have data-slot attribute', () => {
    render(<Button>Test</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button')
  })
})

describe('buttonVariants', () => {
  it('should return default classes when no props provided', () => {
    const classes = buttonVariants({})
    expect(classes).toContain('inline-flex')
    expect(classes).toContain('rounded-md')
  })

  it('should include variant classes', () => {
    const classes = buttonVariants({ variant: 'destructive' })
    expect(classes).toContain('bg-destructive')
  })

  it('should include size classes', () => {
    const classes = buttonVariants({ size: 'lg' })
    expect(classes).toContain('h-10')
  })
})
