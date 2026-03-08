import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, badgeVariants } from './badge'

describe('Badge', () => {
  it('should render badge with default props', () => {
    render(<Badge>Default Badge</Badge>)

    expect(screen.getByText('Default Badge')).toBeInTheDocument()
  })

  it('should render badge with different variants', () => {
    const { rerender } = render(<Badge variant="default">Default</Badge>)
    expect(screen.getByText('Default')).toBeInTheDocument()

    rerender(<Badge variant="secondary">Secondary</Badge>)
    expect(screen.getByText('Secondary')).toBeInTheDocument()

    rerender(<Badge variant="destructive">Destructive</Badge>)
    expect(screen.getByText('Destructive')).toBeInTheDocument()

    rerender(<Badge variant="outline">Outline</Badge>)
    expect(screen.getByText('Outline')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>)

    expect(screen.getByText('Custom')).toHaveClass('custom-badge')
  })

  it('should render as child when asChild is true', () => {
    render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>
    )

    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('should have data-slot attribute', () => {
    render(<Badge>Test</Badge>)

    expect(screen.getByText('Test')).toHaveAttribute('data-slot', 'badge')
  })

  it('should render with icon', () => {
    render(
      <Badge>
        <svg data-testid="icon" />
        With Icon
      </Badge>
    )

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('With Icon')).toBeInTheDocument()
  })
})

describe('badgeVariants', () => {
  it('should return default classes when no props provided', () => {
    const classes = badgeVariants({})
    expect(classes).toContain('inline-flex')
    expect(classes).toContain('rounded-md')
  })

  it('should include variant classes', () => {
    const classes = badgeVariants({ variant: 'destructive' })
    expect(classes).toContain('bg-destructive')
  })
})
