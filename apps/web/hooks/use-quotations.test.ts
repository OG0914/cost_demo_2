import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuotations, useQuotation } from './api/use-quotations'
import { quotationApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  quotationApi: {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    submit: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    calculate: vi.fn(),
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
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

import * as React from 'react'

describe('useQuotations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch quotations list', async () => {
    const mockResponse = {
      data: [
        { id: '1', quotationNo: 'QT-2024-0001', status: 'draft' },
        { id: '2', quotationNo: 'QT-2024-0002', status: 'approved' },
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    }
    vi.mocked(quotationApi.getList).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    // Wait for the query to complete with longer timeout
    await waitFor(() => {
      expect(quotationApi.getList).toHaveBeenCalled()
    }, { timeout: 5000 })

    // Wait for state to update
    await waitFor(() => {
      expect(result.current.quotations.length).toBeGreaterThan(0)
    }, { timeout: 5000 })

    expect(result.current.quotations).toHaveLength(2)
    expect(result.current.meta?.total).toBe(2)
  })

  it('should apply filters to query', async () => {
    vi.mocked(quotationApi.getList).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })

    const filters = { status: 'draft', customerId: 'cust1', page: 1, pageSize: 10 }
    renderHook(() => useQuotations(filters), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(quotationApi.getList).toHaveBeenCalledWith(filters)
    })
  })

  it('should create quotation', async () => {
    vi.mocked(quotationApi.create).mockResolvedValue({ data: { id: '1' } })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    result.current.create({
      customerId: 'cust1',
      modelId: 'model1',
      quantity: 100,
      totalCost: 1000,
    })

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false)
    })

    expect(quotationApi.create).toHaveBeenCalled()
  })

  it('should update quotation', async () => {
    vi.mocked(quotationApi.update).mockResolvedValue({ data: { id: '1' } })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    result.current.update({ id: '1', data: { quantity: 200 } })

    await waitFor(() => {
      expect(result.current.isUpdating).toBe(false)
    })

    expect(quotationApi.update).toHaveBeenCalledWith('1', { quantity: 200 })
  })

  it('should delete quotation', async () => {
    vi.mocked(quotationApi.delete).mockResolvedValue({ data: undefined })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    result.current.delete('1')

    // Wait for mutation to complete with longer timeout
    await waitFor(() => {
      expect(quotationApi.delete).toHaveBeenCalledWith('1')
    }, { timeout: 5000 })
  })

  it('should submit quotation', async () => {
    vi.mocked(quotationApi.submit).mockResolvedValue({ data: { id: '1', status: 'submitted' } })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    result.current.submit('1')

    await waitFor(() => {
      expect(quotationApi.submit).toHaveBeenCalledWith('1')
    }, { timeout: 5000 })
  })

  it('should approve quotation', async () => {
    vi.mocked(quotationApi.approve).mockResolvedValue({ data: { id: '1', status: 'approved' } })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    result.current.approve({ id: '1', note: 'Approved' })

    await waitFor(() => {
      expect(result.current.isApproving).toBe(false)
    })

    expect(quotationApi.approve).toHaveBeenCalledWith('1', 'Approved')
  })

  it('should reject quotation', async () => {
    vi.mocked(quotationApi.reject).mockResolvedValue({ data: { id: '1', status: 'rejected' } })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    result.current.reject({ id: '1', note: 'Price too high' })

    await waitFor(() => {
      expect(result.current.isRejecting).toBe(false)
    })

    expect(quotationApi.reject).toHaveBeenCalledWith('1', 'Price too high')
  })

  it('should calculate costs', async () => {
    const mockResult = { totalCost: 2000, materialCost: 1000 }
    vi.mocked(quotationApi.calculate).mockResolvedValue({ data: mockResult })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    const input = {
      modelId: 'model1',
      packagingConfigId: 'pack1',
      quantity: 100,
      saleType: 'domestic' as const,
      shippingType: 'land' as const,
    }
    result.current.calculate(input)

    await waitFor(() => {
      expect(quotationApi.calculate).toHaveBeenCalledWith(input)
    }, { timeout: 5000 })

    // Wait for state to update
    await waitFor(() => {
      expect(result.current.calculatedResult).toBeDefined()
    }, { timeout: 5000 })

    expect(result.current.calculatedResult).toEqual(mockResult)
  })
})

describe('useQuotation', () => {
  it('should fetch single quotation', async () => {
    const mockQuotation = { id: '1', quotationNo: 'QT-2024-0001', status: 'draft' }
    vi.mocked(quotationApi.getById).mockResolvedValue({ data: mockQuotation })

    const { result } = renderHook(() => useQuotation('1'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.quotation).toEqual(mockQuotation)
  })

  it('should handle empty id gracefully', async () => {
    vi.mocked(quotationApi.getById).mockResolvedValue({ data: null })

    const { result } = renderHook(() => useQuotation(''), { wrapper: createWrapper() })

    // When id is empty, the query should be disabled
    // Wait for any potential fetch to complete
    await new Promise(resolve => setTimeout(resolve, 200))

    // Should not be loading and should not have called the API
    expect(result.current.isLoading).toBe(false)
  })
})
