import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PackagingService } from './packaging.service.js'
import { packagingRepository } from '../repositories/packaging.repository.js'
import { STANDARD_BOX, NO_BOX, BLISTER_DIRECT, BLISTER_BAG } from '@cost/shared-types'

vi.mock('../repositories/packaging.repository.js', () => ({
  packagingRepository: {
    findMany: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findProcesses: vi.fn(),
    findProcessById: vi.fn(),
    createProcess: vi.fn(),
    updateProcess: vi.fn(),
    deleteProcess: vi.fn(),
    findLastProcessBySortOrder: vi.fn(),
    findMaterials: vi.fn(),
    findMaterialById: vi.fn(),
    createMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
  },
}))

vi.mock('@cost/database', () => ({
  prisma: {
    model: {
      findUnique: vi.fn(),
    },
    material: {
      findUnique: vi.fn(),
    },
  },
}))

describe('PackagingService', () => {
  let service: PackagingService

  beforeEach(() => {
    service = new PackagingService()
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return paginated packaging configs', async () => {
      const configs = [{ id: '1', name: 'Config 1', packagingType: STANDARD_BOX, perBox: 50, perCarton: 200, layer1: 1, layer2: 50, layer3: 4 }]
      vi.mocked(packagingRepository.findMany).mockResolvedValue(configs as never)
      vi.mocked(packagingRepository.count).mockResolvedValue(1)

      const result = await service.getList({}, { page: 1, pageSize: 20 })

      expect(result.data).toEqual(configs)
      expect(result.meta.totalPages).toBe(1)
    })
  })

  describe('getById', () => {
    it('should return config by id', async () => {
      const config = { id: '1', name: 'Config 1', packagingType: STANDARD_BOX }
      vi.mocked(packagingRepository.findById).mockResolvedValue(config as never)

      const result = await service.getById('1')

      expect(result).toEqual(config)
    })
  })

  describe('create', () => {
    it('should create standard_box config and calculate perBox/perCarton', async () => {
      const input = {
        modelId: 'model1',
        name: 'Standard Box',
        packagingType: STANDARD_BOX,
        layer1: 1,
        layer2: 50,
        layer3: 4,
      }
      const { prisma } = await import('@cost/database')
      vi.mocked(prisma.model.findUnique).mockResolvedValue({ id: 'model1' } as never)
      vi.mocked(packagingRepository.create).mockResolvedValue({ id: '1', ...input } as never)

      await service.create(input)

      expect(packagingRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        model: { connect: { id: 'model1' } },
        name: 'Standard Box',
        packagingType: STANDARD_BOX,
        layer1: 1,
        layer2: 50,
        layer3: 4,
        perBox: 50,
        perCarton: 200,
      }))
    })

    it('should create no_box config with perBox as null', async () => {
      const input = {
        modelId: 'model1',
        name: 'No Box',
        packagingType: NO_BOX,
        layer1: 1,
        layer2: 500,
      }
      const { prisma } = await import('@cost/database')
      vi.mocked(prisma.model.findUnique).mockResolvedValue({ id: 'model1' } as never)
      vi.mocked(packagingRepository.create).mockResolvedValue({ id: '1', ...input } as never)

      await service.create(input)

      expect(packagingRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        perBox: null,
        perCarton: 500,
      }))
    })

    it('should throw INVALID_MODEL when model not found', async () => {
      const { prisma } = await import('@cost/database')
      vi.mocked(prisma.model.findUnique).mockResolvedValue(null)

      await expect(service.create({
        modelId: 'invalid',
        name: 'Config',
        packagingType: STANDARD_BOX,
        layer1: 1,
        layer2: 10,
      })).rejects.toThrow('INVALID_MODEL')
    })
  })

  describe('update', () => {
    it('should recalculate perBox/perCarton when layers change', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue({
        id: '1',
        name: 'Old',
        packagingType: STANDARD_BOX,
        layer1: 1,
        layer2: 10,
        layer3: 2,
      } as never)
      vi.mocked(packagingRepository.update).mockResolvedValue({ id: '1', name: 'Updated' } as never)

      await service.update('1', { layer2: 20 })

      expect(packagingRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        perBox: 20,
        perCarton: 40,
        layer2: 20,
      }))
    })

    it('should throw NOT_FOUND when config does not exist', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue(null)

      await expect(service.update('999', { name: 'Test' })).rejects.toThrow('NOT_FOUND')
    })
  })

  describe('delete', () => {
    it('should delete config when found', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.delete).mockResolvedValue(undefined as never)

      await service.delete('1')

      expect(packagingRepository.delete).toHaveBeenCalledWith('1')
    })

    it('should throw NOT_FOUND when config does not exist', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue(null)

      await expect(service.delete('999')).rejects.toThrow('NOT_FOUND')
    })
  })

  describe('getProcesses', () => {
    it('should return processes for config', async () => {
      const processes = [{ id: '1', name: 'Process 1', sortOrder: 1 }]
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.findProcesses).mockResolvedValue(processes as never)

      const result = await service.getProcesses('1')

      expect(result).toEqual(processes)
    })
  })

  describe('createProcess', () => {
    it('should create process with auto-incremented sortOrder', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.findLastProcessBySortOrder).mockResolvedValue({ sortOrder: 3 } as never)
      vi.mocked(packagingRepository.createProcess).mockResolvedValue({ id: '1', sortOrder: 4 } as never)

      await service.createProcess({
        packagingConfigId: '1',
        name: 'New Process',
        price: 100,
        unit: 'piece',
      })

      expect(packagingRepository.createProcess).toHaveBeenCalledWith(expect.objectContaining({
        sortOrder: 4,
      }))
    })
  })

  describe('createMaterial', () => {
    it('should create material with boxVolume', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.createMaterial).mockResolvedValue({ id: '1' } as never)
      const { prisma } = await import('@cost/database')
      vi.mocked(prisma.material.findUnique).mockResolvedValue({ id: 'mat1' } as never)

      await service.createMaterial({
        packagingConfigId: '1',
        materialId: 'mat1',
        quantity: 10,
        boxVolume: 0.5,
      })

      expect(packagingRepository.createMaterial).toHaveBeenCalledWith(expect.objectContaining({
        material: { connect: { id: 'mat1' } },
        quantity: 10,
        boxVolume: 0.5,
      }))
    })
  })
})
