import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboard } from './api/use-dashboard'
import { dashboardApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  dashboardApi: {
    getStats: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  )
}

import * as React from 'react'

describe('useDashboard', () => {
  it('should fetch dashboard stats', async () => {
    const mockStats = {
      totalQuotations: 100,
      pendingQuotations: 20,
      approvedQuotations: 70,
      rejectedQuotations: 10,
      totalCustomers: 50,
      totalMaterials: 200,
    }
    vi.mocked(dashboardApi.getStats).mockResolvedValue({ data: mockStats })

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats).toEqual(mockStats)
  })

  it('should handle error state', async () => {
    vi.mocked(dashboardApi.getStats).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should return undefined stats initially', () => {
    vi.mocked(dashboardApi.getStats).mockResolvedValue({ data: null })

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    expect(result.current.stats).toBeUndefined()
  })
})
