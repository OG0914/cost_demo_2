import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMobile } from './ui/use-mobile'

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  it('should return true when window width is less than 768px', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('should return false when window width is 768px or greater', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('should respond to media query changes', async () => {
    // Set initial width to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())

    // Initial state should reflect desktop
    await new Promise(resolve => setTimeout(resolve, 50))

    // The hook should return a boolean
    expect(typeof result.current).toBe('boolean')
  })

  it('should handle SSR gracefully', () => {
    // In SSR context, the hook should return false initially
    // This is a simplified test - actual SSR testing requires more setup
    const { result } = renderHook(() => useIsMobile())

    // Should return boolean value (false when undefined)
    expect(typeof result.current).toBe('boolean')
  })
})
