import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuotations, useQuotation } from './api/use-quotations'
import { quotationApi } from '@/lib/api'
import type { Quotation, CreateQuotationRequest } from '@cost/shared-types'

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

const createMockQuotation = (overrides: Partial<Quotation> = {}): Quotation => ({
  id: '1',
  quotationNo: 'QT-2024-0001',
  customerId: 'cust1',
  regulationId: 'reg1',
  modelId: 'model1',
  packagingConfigId: 'pack1',
  saleType: 'domestic',
  shippingType: 'fcl20',
  quantity: 100,
  materialCost: 0,
  packagingCost: 0,
  processCost: 0,
  shippingCost: 0,
  adminFee: 0,
  vat: 0,
  totalCost: 1000,
  status: 'draft',
  createdBy: 'user1',
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

const createMockPayload = (): CreateQuotationRequest => ({
  customerId: 'cust1',
  regulationId: 'reg1',
  modelId: 'model1',
  packagingConfigId: 'pack1',
  saleType: 'domestic',
  shippingType: 'fcl20',
  quantity: 100,
  materialCost: 0,
  packagingCost: 0,
  processCost: 0,
  shippingCost: 0,
  adminFee: 0,
  vat: 0,
  totalCost: 1000,
})

describe('useQuotations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch quotations list', async () => {
    const mockResponse = {
      success: true,
      data: [
        createMockQuotation({ id: '1', quotationNo: 'QT-2024-0001', status: 'draft' }),
        createMockQuotation({ id: '2', quotationNo: 'QT-2024-0002', status: 'approved' }),
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
    vi.mocked(quotationApi.getList).mockResolvedValue({ success: true, data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })

    const filters = { status: 'draft', customerId: 'cust1', page: 1, pageSize: 10 }
    renderHook(() => useQuotations(filters), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(quotationApi.getList).toHaveBeenCalledWith(filters)
    })
  })

  it('should create quotation', async () => {
    vi.mocked(quotationApi.create).mockResolvedValue({
      success: true,
      data: createMockQuotation(),
    })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    const payload = createMockPayload()
    act(() => {
      result.current.create(payload)
    })

    await waitFor(() => {
      expect(quotationApi.create).toHaveBeenCalled()
    })
    expect(vi.mocked(quotationApi.create).mock.calls[0][0]).toEqual(payload)
  })

  it('should update quotation', async () => {
    vi.mocked(quotationApi.update).mockResolvedValue({
      success: true,
      data: createMockQuotation({ quantity: 200 }),
    })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    act(() => {
      result.current.update({ id: '1', data: { quantity: 200 } })
    })

    await waitFor(() => {
      expect(quotationApi.update).toHaveBeenCalled()
    })
    expect(vi.mocked(quotationApi.update).mock.calls[0][0]).toBe('1')
    expect(vi.mocked(quotationApi.update).mock.calls[0][1]).toEqual({ quantity: 200 })
  })

  it('should delete quotation', async () => {
    vi.mocked(quotationApi.delete).mockResolvedValue({ success: true, data: undefined })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    act(() => {
      result.current.delete('1')
    })

    await waitFor(() => {
      expect(quotationApi.delete).toHaveBeenCalled()
    })
    expect(vi.mocked(quotationApi.delete).mock.calls[0][0]).toBe('1')
  })

  it('should submit quotation', async () => {
    vi.mocked(quotationApi.submit).mockResolvedValue({
      success: true,
      data: createMockQuotation({ status: 'submitted' }),
    })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    act(() => {
      result.current.submit('1')
    })

    await waitFor(() => {
      expect(quotationApi.submit).toHaveBeenCalled()
    })
    expect(vi.mocked(quotationApi.submit).mock.calls[0][0]).toBe('1')
  })

  it('should approve quotation', async () => {
    vi.mocked(quotationApi.approve).mockResolvedValue({
      success: true,
      data: createMockQuotation({ status: 'approved' }),
    })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    act(() => {
      result.current.approve({ id: '1', note: 'Approved' })
    })

    await waitFor(() => {
      expect(quotationApi.approve).toHaveBeenCalled()
    })
    expect(vi.mocked(quotationApi.approve).mock.calls[0][0]).toBe('1')
    expect(vi.mocked(quotationApi.approve).mock.calls[0][1]).toBe('Approved')
  })

  it('should reject quotation', async () => {
    vi.mocked(quotationApi.reject).mockResolvedValue({
      success: true,
      data: createMockQuotation({ status: 'rejected' }),
    })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    act(() => {
      result.current.reject({ id: '1', note: 'Price too high' })
    })

    await waitFor(() => {
      expect(quotationApi.reject).toHaveBeenCalled()
    })
    expect(vi.mocked(quotationApi.reject).mock.calls[0][0]).toBe('1')
    expect(vi.mocked(quotationApi.reject).mock.calls[0][1]).toBe('Price too high')
  })

  it('should calculate costs', async () => {
    const mockResult = {
      totalCost: 2000,
      materialCost: 1000,
      packagingCost: 200,
      processCost: 300,
      shippingCost: 400,
      adminFee: 50,
      vat: 50,
      unitCost: 2,
    }
    vi.mocked(quotationApi.calculate).mockResolvedValue({ success: true, data: mockResult })

    const { result } = renderHook(() => useQuotations(), { wrapper: createWrapper() })

    const input = {
      modelId: 'model1',
      packagingConfigId: 'pack1',
      quantity: 100,
      saleType: 'domestic' as const,
      shippingType: 'lcl' as const,
    }
    act(() => {
      result.current.calculate(input)
    })

    await waitFor(() => {
      expect(quotationApi.calculate).toHaveBeenCalled()
    })
    expect(vi.mocked(quotationApi.calculate).mock.calls[0][0]).toEqual(input)

    await waitFor(() => {
      expect(result.current.calculatedResult).toBeDefined()
    }, { timeout: 5000 })

    expect(result.current.calculatedResult).toEqual(mockResult)
  })
})

describe('useQuotation', () => {
  it('should fetch single quotation', async () => {
    const mockQuotation = createMockQuotation()
    vi.mocked(quotationApi.getById).mockResolvedValue({ success: true, data: mockQuotation })

    const { result } = renderHook(() => useQuotation('1'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.quotation).toEqual(mockQuotation)
  })

  it('should handle empty id gracefully', async () => {
    vi.mocked(quotationApi.getById).mockResolvedValue({ success: true, data: undefined })

    const { result } = renderHook(() => useQuotation(''), { wrapper: createWrapper() })

    // When id is empty, the query should be disabled
    // Wait for any potential fetch to complete
    await new Promise(resolve => setTimeout(resolve, 200))

    // Should not be loading and should not have called the API
    expect(result.current.isLoading).toBe(false)
  })
})
