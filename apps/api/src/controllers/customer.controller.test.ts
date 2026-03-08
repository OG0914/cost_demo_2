import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomerController } from './customer.controller.js'
import { customerService } from '../services/customer.service.js'
import type { FastifyRequest, FastifyReply } from 'fastify'

vi.mock('../services/customer.service.js', () => ({
  customerService: {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

describe('CustomerController', () => {
  let controller: CustomerController
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(() => {
    controller = new CustomerController()
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return customer list with search filter', async () => {
      const mockCustomers = {
        data: [{ id: '1', code: 'C001', name: 'Test Customer', region: 'CN', createdAt: new Date(), updatedAt: new Date(), createdBy: 'user1', updatedBy: 'user1' }],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }
      vi.mocked(customerService.getList).mockResolvedValue(mockCustomers)
      mockRequest = { query: { page: '1', pageSize: '20', search: 'Test' } }

      await controller.getList(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(customerService.getList).toHaveBeenCalledWith(
        { search: 'Test' },
        { page: 1, pageSize: 20 }
      )
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockCustomers.data,
        meta: mockCustomers.meta,
      }))
    })

    it('should use default values when not provided', async () => {
      vi.mocked(customerService.getList).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })
      mockRequest = { query: {} }

      await controller.getList(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(customerService.getList).toHaveBeenCalledWith(
        { search: '' },
        { page: 1, pageSize: 20 }
      )
    })
  })

  describe('getById', () => {
    it('should return customer by id', async () => {
      const mockCustomer = { id: '1', code: 'C001', name: 'Test Customer', region: 'CN', createdAt: new Date(), updatedAt: new Date(), createdBy: 'user1', updatedBy: 'user1' }
      vi.mocked(customerService.getById).mockResolvedValue(mockCustomer)
      mockRequest = { params: { id: '1' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(customerService.getById).toHaveBeenCalledWith('1')
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockCustomer,
      }))
    })

    it('should return 404 when customer not found', async () => {
      vi.mocked(customerService.getById).mockResolvedValue(null)
      mockRequest = { params: { id: '999' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
        }),
      }))
    })
  })

  describe('create', () => {
    it('should create customer with valid data', async () => {
      const input = { code: 'C002', name: 'New Customer', region: 'US', note: 'Test note' }
      const mockCustomer = { id: '2', ...input, createdAt: new Date(), updatedAt: new Date(), createdBy: 'user1', updatedBy: 'user1' }
      vi.mocked(customerService.create).mockResolvedValue(mockCustomer)
      mockRequest = {
        body: input,
        user: { userId: 'user1' },
      }

      await controller.create(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(customerService.create).toHaveBeenCalledWith(expect.objectContaining({
        code: 'C002',
        name: 'New Customer',
        region: 'US',
        createdBy: 'user1',
      }))
      expect(mockReply.code).toHaveBeenCalledWith(201)
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockCustomer,
      }))
    })

    it('should return 400 for invalid data', async () => {
      mockRequest = {
        body: { code: '', name: '', region: '' },
        user: { userId: 'user1' },
      }

      await controller.create(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(400)
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      }))
    })
  })

  describe('update', () => {
    it('should update customer with valid data', async () => {
      const input = { name: 'Updated Name', region: 'JP' }
      const mockCustomer = { id: '1', code: 'C001', name: 'Updated Name', region: 'JP', createdAt: new Date(), updatedAt: new Date(), createdBy: 'user1', updatedBy: 'user1' }
      vi.mocked(customerService.update).mockResolvedValue(mockCustomer)
      mockRequest = {
        params: { id: '1' },
        body: input,
        user: { userId: 'user1' },
      }

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(customerService.update).toHaveBeenCalledWith('1', expect.objectContaining({
        name: 'Updated Name',
        region: 'JP',
        updatedBy: 'user1',
      }))
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockCustomer,
      }))
    })
  })

  describe('delete', () => {
    it('should delete customer by id', async () => {
      vi.mocked(customerService.delete).mockResolvedValue(undefined)
      mockRequest = { params: { id: '1' } }

      await controller.delete(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(customerService.delete).toHaveBeenCalledWith('1')
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { message: '客户已删除' },
      }))
    })
  })
})
