import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MaterialController } from './material.controller.js'
import { materialService } from '../services/material.service.js'
import type { FastifyRequest, FastifyReply } from 'fastify'

vi.mock('../services/material.service.js', () => ({
  materialService: {
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

describe('MaterialController', () => {
  let controller: MaterialController
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(() => {
    controller = new MaterialController()
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return material list with filters', async () => {
      const mockMaterials = {
        data: [{ id: '1', materialNo: 'M001', name: 'Material 1', unit: 'pcs', price: 100, currency: 'CNY' }],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }
      vi.mocked(materialService.getList).mockResolvedValue(mockMaterials)
      mockRequest = { query: { page: '1', pageSize: '20', search: 'M001', category: 'raw' } }

      await controller.getList(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(materialService.getList).toHaveBeenCalledWith(
        { search: 'M001', category: 'raw' },
        { page: 1, pageSize: 20 }
      )
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockMaterials.data,
        meta: mockMaterials.meta,
      }))
    })
  })

  describe('getById', () => {
    it('should return material by id', async () => {
      const mockMaterial = { id: '1', materialNo: 'M001', name: 'Material 1', unit: 'pcs', price: 100, currency: 'CNY' }
      vi.mocked(materialService.getById).mockResolvedValue(mockMaterial)
      mockRequest = { params: { id: '1' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(materialService.getById).toHaveBeenCalledWith('1')
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockMaterial,
      }))
    })

    it('should return 404 when material not found', async () => {
      vi.mocked(materialService.getById).mockResolvedValue(null)
      mockRequest = { params: { id: '999' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
    })
  })

  describe('create', () => {
    it('should create material with valid data', async () => {
      const input = {
        materialNo: 'M002',
        name: 'New Material',
        unit: 'pcs',
        price: 200,
        currency: 'CNY',
        manufacturer: 'Test Corp',
        category: 'raw',
      }
      const mockMaterial = { id: '2', ...input }
      vi.mocked(materialService.create).mockResolvedValue(mockMaterial)
      mockRequest = { body: input }

      await controller.create(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(materialService.create).toHaveBeenCalledWith(input)
      expect(mockReply.code).toHaveBeenCalledWith(201)
    })

    it('should return 409 for duplicate materialNo', async () => {
      vi.mocked(materialService.create).mockRejectedValue(new Error('DUPLICATE_MATERIAL_NO'))
      mockRequest = { body: { materialNo: 'M001', name: 'Test', unit: 'pcs', price: 100 } }

      await controller.create(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(409)
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'DUPLICATE_MATERIAL_NO',
        }),
      }))
    })
  })

  describe('update', () => {
    it('should update material with valid data', async () => {
      const input = { name: 'Updated Material', price: 300 }
      const mockMaterial = { id: '1', materialNo: 'M001', ...input, unit: 'pcs', currency: 'CNY' }
      vi.mocked(materialService.update).mockResolvedValue(mockMaterial)
      mockRequest = { params: { id: '1' }, body: input }

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(materialService.update).toHaveBeenCalledWith('1', input)
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockMaterial,
      }))
    })

    it('should return 404 when material not found', async () => {
      vi.mocked(materialService.update).mockRejectedValue(new Error('NOT_FOUND'))
      mockRequest = { params: { id: '999' }, body: { name: 'Test' } }

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
    })
  })

  describe('delete', () => {
    it('should delete material by id', async () => {
      vi.mocked(materialService.delete).mockResolvedValue(undefined)
      mockRequest = { params: { id: '1' } }

      await controller.delete(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(materialService.delete).toHaveBeenCalledWith('1')
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { message: '物料已删除' },
      }))
    })

    it('should return 404 when material not found', async () => {
      vi.mocked(materialService.delete).mockRejectedValue(new Error('NOT_FOUND'))
      mockRequest = { params: { id: '999' } }

      await controller.delete(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
    })
  })
})
