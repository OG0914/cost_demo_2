import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PackagingService } from './packaging.service.js'
import { packagingRepository } from '../repositories/packaging.repository.js'

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
      const configs = [{ id: '1', name: 'Config 1', packagingType: 'box', perBox: 10, perCarton: 100 }]
      vi.mocked(packagingRepository.findMany).mockResolvedValue(configs as never)
      vi.mocked(packagingRepository.count).mockResolvedValue(1)

      const result = await service.getList({}, { page: 1, pageSize: 20 })

      expect(result.data).toEqual(configs)
      expect(result.meta.totalPages).toBe(1)
    })
  })

  describe('getById', () => {
    it('should return config by id', async () => {
      const config = { id: '1', name: 'Config 1', packagingType: 'box' }
      vi.mocked(packagingRepository.findById).mockResolvedValue(config as never)

      const result = await service.getById('1')

      expect(result).toEqual(config)
    })
  })

  describe('create', () => {
    it('should create config when model exists', async () => {
      const input = {
        modelId: 'model1',
        name: 'New Config',
        packagingType: 'carton',
        perBox: 10,
        perCarton: 100,
      }
      const { prisma } = await import('@cost/database')
      vi.mocked(prisma.model.findUnique).mockResolvedValue({ id: 'model1' } as never)
      vi.mocked(packagingRepository.create).mockResolvedValue({ id: '1', ...input } as never)

      const result = await service.create(input)

      expect(packagingRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        model: { connect: { id: 'model1' } },
        name: 'New Config',
      }))
      expect(result).toBeDefined()
    })

    it('should throw INVALID_MODEL when model not found', async () => {
      const { prisma } = await import('@cost/database')
      vi.mocked(prisma.model.findUnique).mockResolvedValue(null)

      await expect(service.create({
        modelId: 'invalid',
        name: 'Config',
        packagingType: 'box',
        perBox: 10,
        perCarton: 100,
      })).rejects.toThrow('INVALID_MODEL')
    })
  })

  describe('update', () => {
    it('should update config when found', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.update).mockResolvedValue({ id: '1', name: 'Updated' } as never)

      const result = await service.update('1', { name: 'Updated' })

      expect(result.name).toBe('Updated')
    })

    it('should throw NOT_FOUND when config does not exist', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue(null)

      await expect(service.update('999', { name: 'Test' })).rejects.toThrow('NOT_FOUND')
    })
  })

  describe('delete', () => {
    it('should delete config when found', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.delete).mockResolvedValue(undefined)

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

    it('should throw NOT_FOUND when config does not exist', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue(null)

      await expect(service.getProcesses('999')).rejects.toThrow('NOT_FOUND')
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

    it('should use provided sortOrder when given', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.createProcess).mockResolvedValue({} as never)

      await service.createProcess({
        packagingConfigId: '1',
        name: 'Process',
        price: 100,
        unit: 'piece',
        sortOrder: 10,
      })

      expect(packagingRepository.createProcess).toHaveBeenCalledWith(expect.objectContaining({
        sortOrder: 10,
      }))
    })

    it('should start sortOrder at 1 when no existing processes', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.findLastProcessBySortOrder).mockResolvedValue(null)
      vi.mocked(packagingRepository.createProcess).mockResolvedValue({} as never)

      await service.createProcess({
        packagingConfigId: '1',
        name: 'First Process',
        price: 100,
        unit: 'piece',
      })

      expect(packagingRepository.createProcess).toHaveBeenCalledWith(expect.objectContaining({
        sortOrder: 1,
      }))
    })
  })

  describe('updateProcess', () => {
    it('should update process when found', async () => {
      vi.mocked(packagingRepository.findProcessById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.updateProcess).mockResolvedValue({ id: '1', name: 'Updated' } as never)

      const result = await service.updateProcess('1', { name: 'Updated' })

      expect(result.name).toBe('Updated')
    })

    it('should throw NOT_FOUND when process does not exist', async () => {
      vi.mocked(packagingRepository.findProcessById).mockResolvedValue(null)

      await expect(service.updateProcess('999', { name: 'Test' })).rejects.toThrow('NOT_FOUND')
    })
  })

  describe('deleteProcess', () => {
    it('should throw NOT_FOUND when process does not exist', async () => {
      vi.mocked(packagingRepository.findProcessById).mockResolvedValue(null)

      await expect(service.deleteProcess('999')).rejects.toThrow('NOT_FOUND')
    })
  })

  describe('getMaterials', () => {
    it('should return materials for config', async () => {
      const materials = [{ id: '1', name: 'Material 1' }]
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.findMaterials).mockResolvedValue(materials as never)

      const result = await service.getMaterials('1')

      expect(result).toEqual(materials)
    })
  })

  describe('createMaterial', () => {
    it('should create material when config exists', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue({ id: '1' } as never)
      vi.mocked(packagingRepository.createMaterial).mockResolvedValue({ id: '1' } as never)

      await service.createMaterial({
        packagingConfigId: '1',
        name: 'Material',
        quantity: 10,
        price: 100,
      })

      expect(packagingRepository.createMaterial).toHaveBeenCalled()
    })

    it('should throw INVALID_CONFIG when config does not exist', async () => {
      vi.mocked(packagingRepository.findById).mockResolvedValue(null)

      await expect(service.createMaterial({
        packagingConfigId: '999',
        name: 'Material',
        quantity: 10,
        price: 100,
      })).rejects.toThrow('INVALID_CONFIG')
    })
  })
})
