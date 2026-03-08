import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toBe('base active')
  })

  it('should filter out falsy values', () => {
    const result = cn('base', false && 'hidden', null, undefined, 'visible')
    expect(result).toBe('base visible')
  })

  it('should handle object syntax', () => {
    const result = cn({ active: true, disabled: false })
    expect(result).toBe('active')
  })

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('should return empty string for no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })
})
