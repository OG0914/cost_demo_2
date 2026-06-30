import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PackagingController } from './packaging.controller.js'
import { packagingService } from '../services/packaging.service.js'
import type { FastifyRequest, FastifyReply } from 'fastify'

vi.mock('../services/packaging.service.js', () => ({
  packagingService: {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getProcesses: vi.fn(),
    createProcess: vi.fn(),
    updateProcess: vi.fn(),
    deleteProcess: vi.fn(),
    getMaterials: vi.fn(),
    createMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
  },
}))

vi.mock('../lib/response-helpers.js', () => ({
  sendSuccess: vi.fn((reply, data, meta, status = 200) => {
    const response: { success: boolean; data: unknown; meta?: unknown } = { success: true, data }
    if (meta) response.meta = meta
    return reply.code(status).send(response)
  }),
  sendError: vi.fn((reply, status, code, message) => {
    return reply.code(status).send({ success: false, error: { code, message } })
  }),
  sendNotFound: vi.fn((reply, resource) => {
    return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: `${resource}不存在` } })
  }),
}))

describe('PackagingController', () => {
  let controller: PackagingController
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(() => {
    controller = new PackagingController()
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return packaging config list', async () => {
      const mockConfigs = {
        data: [{ id: '1', name: 'Config 1', packagingType: 'standard_box', perBox: 50, perCarton: 200, layer1: 1, layer2: 50, layer3: 4 }],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }
      vi.mocked(packagingService.getList).mockResolvedValue(mockConfigs as never)
      mockRequest = { query: { page: '1', pageSize: '20', modelId: 'model1' } }

      await controller.getList(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(packagingService.getList).toHaveBeenCalledWith(
        { modelId: 'model1' },
        { page: 1, pageSize: 20 }
      )
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockConfigs.data,
        meta: mockConfigs.meta,
      }))
    })
  })

  describe('getById', () => {
    it('should return config by id', async () => {
      const mockConfig = { id: '1', name: 'Config 1', packagingType: 'box' }
      vi.mocked(packagingService.getById).mockResolvedValue(mockConfig as never)
      mockRequest = { params: { id: '1' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockConfig,
      }))
    })

    it('should return 404 when config not found', async () => {
      vi.mocked(packagingService.getById).mockResolvedValue(null)
      mockRequest = { params: { id: '999' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
    })
  })

  describe('create', () => {
    it('should create config with valid data', async () => {
      const input = { modelId: '550e8400-e29b-41d4-a716-446655440000', name: 'New Config', packagingType: 'standard_box', layer1: 1, layer2: 50, layer3: 4 }
      vi.mocked(packagingService.create).mockResolvedValue({ id: '1', ...input } as never)
      mockRequest = { body: input }

      await controller.create(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(201)
    })

    it('should return 400 for invalid model', async () => {
      vi.mocked(packagingService.create).mockRejectedValue(new Error('INVALID_MODEL'))
      mockRequest = { body: { modelId: 'invalid', name: 'Test', packagingType: 'standard_box', layer1: 1, layer2: 50 } }

      await controller.create(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(400)
    })
  })

  describe('getProcesses', () => {
    it('should return processes for config', async () => {
      const processes = [{ id: '1', name: 'Process 1', sortOrder: 1 }]
      vi.mocked(packagingService.getProcesses).mockResolvedValue(processes as never)
      mockRequest = { params: { id: '1' } }

      await controller.getProcesses(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: processes,
      }))
    })
  })

  describe('createProcess', () => {
    it('should create process with valid data', async () => {
      const input = { name: 'New Process', price: 100, unit: 'piece' as const }
      vi.mocked(packagingService.createProcess).mockResolvedValue({ id: '1', packagingConfigId: '1', ...input, sortOrder: 1 } as never)
      mockRequest = { params: { id: '1' }, body: input }

      await controller.createProcess(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(packagingService.createProcess).toHaveBeenCalledWith(expect.objectContaining({
        packagingConfigId: '1',
        name: 'New Process',
        price: 100,
        unit: 'piece',
      }))
      expect(mockReply.code).toHaveBeenCalledWith(201)
    })
  })

  describe('getMaterials', () => {
    it('should return materials for config', async () => {
      const materials = [{ id: '1', materialId: 'mat1', quantity: 10 }]
      vi.mocked(packagingService.getMaterials).mockResolvedValue(materials as never)
      mockRequest = { params: { id: '1' } }

      await controller.getMaterials(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: materials,
      }))
    })
  })

  describe('createMaterial', () => {
    it('should create material with materialId', async () => {
      const input = { materialId: '550e8400-e29b-41d4-a716-446655440000', quantity: 10 }
      vi.mocked(packagingService.createMaterial).mockResolvedValue({ id: '1', packagingConfigId: '1', ...input } as never)
      mockRequest = { params: { id: '1' }, body: input }

      await controller.createMaterial(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(packagingService.createMaterial).toHaveBeenCalledWith(expect.objectContaining({
        packagingConfigId: '1',
        materialId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 10,
      }))
      expect(mockReply.code).toHaveBeenCalledWith(201)
    })

    it('should return 400 for invalid material', async () => {
      vi.mocked(packagingService.createMaterial).mockRejectedValue(new Error('INVALID_MATERIAL'))
      mockRequest = { params: { id: '1' }, body: { materialId: '550e8400-e29b-41d4-a716-446655440000', quantity: 10 } }

      await controller.createMaterial(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(400)
    })
  })

  describe('updateMaterial', () => {
    it('should update material with materialId', async () => {
      const input = { materialId: '550e8400-e29b-41d4-a716-446655440001', quantity: 20 }
      vi.mocked(packagingService.updateMaterial).mockResolvedValue({ id: '1', materialId: '550e8400-e29b-41d4-a716-446655440001', quantity: 20 } as never)
      mockRequest = { params: { materialId: '1' }, body: input }

      await controller.updateMaterial(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(packagingService.updateMaterial).toHaveBeenCalledWith('1', expect.objectContaining({
        materialId: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 20,
      }))
    })

    it('should return 404 when material not found', async () => {
      vi.mocked(packagingService.updateMaterial).mockRejectedValue(new Error('NOT_FOUND'))
      mockRequest = { params: { materialId: '999' }, body: { quantity: 20 } }

      await controller.updateMaterial(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
    })
  })
})
