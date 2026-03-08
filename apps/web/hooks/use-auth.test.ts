import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './api/use-auth'
import { authApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    setAuth: vi.fn(),
    clearAuth: vi.fn(),
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

import * as React from 'react'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should return initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle login success', async () => {
    const mockResponse = {
      data: {
        user: { id: '1', name: 'Test User', role: 'user' },
        token: 'mock-token',
      },
    }
    vi.mocked(authApi.login).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    result.current.login({ username: 'test', password: 'password' })

    await waitFor(() => {
      expect(result.current.isLoggingIn).toBe(false)
    })

    expect(authApi.login).toHaveBeenCalledWith(
      { username: 'test', password: 'password' },
      expect.anything()
    )
  })

  it('should handle login error', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    result.current.login({ username: 'test', password: 'wrong' })

    await waitFor(() => {
      expect(result.current.isLoggingIn).toBe(false)
    })

    expect(authApi.login).toHaveBeenCalled()
  })

  it('should handle logout', async () => {
    vi.mocked(authApi.logout).mockResolvedValue({ data: undefined })

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    result.current.logout()

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
    })

    expect(authApi.logout).toHaveBeenCalled()
  })
})
