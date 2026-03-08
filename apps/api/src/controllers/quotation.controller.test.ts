import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuotationController } from './quotation.controller.js'
import { quotationService } from '../services/quotation.service.js'
import type { FastifyRequest, FastifyReply } from 'fastify'

vi.mock('../services/quotation.service.js', () => ({
  quotationService: {
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

vi.mock('../utils/http-response.js', () => ({
  sendSuccess: vi.fn((reply, data, meta) => {
    const response: { success: boolean; data: unknown; meta?: unknown } = { success: true, data }
    if (meta) response.meta = meta
    return reply.send(response)
  }),
  sendError: vi.fn((reply, status, code, message) => {
    return reply.code(status).send({ success: false, error: { code, message } })
  }),
  sendNotFound: vi.fn((reply, resource) => {
    return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: `${resource}不存在` } })
  }),
}))

describe('QuotationController', () => {
  let controller: QuotationController
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(() => {
    controller = new QuotationController()
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return quotation list with filters', async () => {
      const mockResult = {
        quotations: [{ id: '1', quotationNo: 'QT-2024-0001' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }
      vi.mocked(quotationService.getList).mockResolvedValue(mockResult)
      mockRequest = { query: { page: '1', pageSize: '20', status: 'draft' } }

      await controller.getList(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(quotationService.getList).toHaveBeenCalledWith(expect.objectContaining({
        page: 1,
        pageSize: 20,
        status: 'draft',
      }))
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockResult.quotations,
        meta: expect.objectContaining({ total: 1 }),
      }))
    })
  })

  describe('getById', () => {
    it('should return quotation by id', async () => {
      const mockQuotation = { id: '1', quotationNo: 'QT-2024-0001', status: 'draft' }
      vi.mocked(quotationService.getById).mockResolvedValue(mockQuotation)
      mockRequest = { params: { id: '1' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockQuotation,
      }))
    })

    it('should return 404 when quotation not found', async () => {
      vi.mocked(quotationService.getById).mockResolvedValue(null)
      mockRequest = { params: { id: '999' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
    })
  })

  describe('create', () => {
    it('should create quotation with valid data', async () => {
      const input = {
        customerId: 'cust1',
        regulationId: 'reg1',
        modelId: 'model1',
        packagingConfigId: 'pack1',
        saleType: 'domestic',
        shippingType: 'land',
        quantity: 100,
        materialCost: 1000,
        packagingCost: 200,
        processCost: 300,
        shippingCost: 400,
        adminFee: 50,
        vat: 130,
        totalCost: 2080,
      }
      vi.mocked(quotationService.create).mockResolvedValue({ id: '1', ...input, quotationNo: 'QT-2024-0001', status: 'draft' })
      mockRequest = {
        body: input,
        user: { userId: 'user1' },
      }

      await controller.create(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(quotationService.create).toHaveBeenCalledWith('user1', input)
      expect(mockReply.code).toHaveBeenCalledWith(201)
    })
  })

  describe('update', () => {
    it('should update quotation with valid data', async () => {
      const input = { quantity: 200, totalCost: 3000 }
      vi.mocked(quotationService.update).mockResolvedValue({ id: '1', ...input })
      mockRequest = { params: { id: '1' }, body: input }

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(quotationService.update).toHaveBeenCalledWith('1', input)
    })

    it('should return 400 for invalid status', async () => {
      vi.mocked(quotationService.update).mockRejectedValue(new Error('INVALID_STATUS'))
      mockRequest = { params: { id: '1' }, body: {} }

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(400)
    })
  })

  describe('submit', () => {
    it('should submit draft quotation', async () => {
      vi.mocked(quotationService.submit).mockResolvedValue({ id: '1', status: 'submitted' })
      mockRequest = { params: { id: '1' } }

      await controller.submit(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(quotationService.submit).toHaveBeenCalledWith('1')
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ status: 'submitted' }),
      }))
    })

    it('should return 400 for invalid status transition', async () => {
      vi.mocked(quotationService.submit).mockRejectedValue(new Error('INVALID_STATUS'))
      mockRequest = { params: { id: '1' } }

      await controller.submit(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(400)
    })
  })

  describe('approve', () => {
    it('should approve submitted quotation', async () => {
      vi.mocked(quotationService.approve).mockResolvedValue({ id: '1', status: 'approved' })
      mockRequest = {
        params: { id: '1' },
        body: { note: 'Approved by manager' },
        user: { userId: 'admin1' },
      }

      await controller.approve(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(quotationService.approve).toHaveBeenCalledWith('1', { userId: 'admin1', note: 'Approved by manager' })
    })

    it('should return 400 when not submitted', async () => {
      vi.mocked(quotationService.approve).mockRejectedValue(new Error('INVALID_STATUS'))
      mockRequest = { params: { id: '1' }, body: {}, user: { userId: 'admin1' } }

      await controller.approve(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(400)
    })
  })

  describe('reject', () => {
    it('should reject submitted quotation', async () => {
      vi.mocked(quotationService.reject).mockResolvedValue({ id: '1', status: 'rejected' })
      mockRequest = {
        params: { id: '1' },
        body: { note: 'Price too high' },
        user: { userId: 'admin1' },
      }

      await controller.reject(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(quotationService.reject).toHaveBeenCalledWith('1', { userId: 'admin1', note: 'Price too high' })
    })
  })

  describe('calculate', () => {
    it('should calculate costs', async () => {
      const input = {
        modelId: 'model1',
        packagingConfigId: 'pack1',
        quantity: 100,
        saleType: 'domestic',
        shippingType: 'land',
      }
      const mockResult = { totalCost: 2000, materialCost: 1000, packagingCost: 200, processCost: 300, shippingCost: 400, adminFee: 50, vat: 130 }
      vi.mocked(quotationService.calculate).mockResolvedValue(mockResult)
      mockRequest = { body: input }

      await controller.calculate(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(quotationService.calculate).toHaveBeenCalledWith(input)
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockResult,
      }))
    })
  })
})
