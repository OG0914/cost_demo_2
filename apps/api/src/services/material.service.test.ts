import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MaterialService } from './material.service.js'
import { materialRepository } from '../repositories/material.repository.js'

// Mock the repository
vi.mock('../repositories/material.repository.js', () => ({
  materialRepository: {
    findMany: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    findByMaterialNo: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock prisma
vi.mock('@cost/database', () => ({
  prisma: {
    bomMaterial: {
      findMany: vi.fn(),
    },
    packagingConfig: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
  PrismaClient: vi.fn(),
}))

describe('MaterialService', () => {
  let service: MaterialService

  beforeEach(() => {
    service = new MaterialService()
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return paginated material list', async () => {
      const materials = [{ id: '1', materialNo: 'M001', name: 'Material 1', unit: 'pcs', price: 100, currency: 'CNY' }]
      vi.mocked(materialRepository.findMany).mockResolvedValue(materials)
      vi.mocked(materialRepository.count).mockResolvedValue(1)

      const result = await service.getList({}, { page: 1, pageSize: 20 })

      expect(result.data).toEqual(materials)
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      })
    })

    it('should calculate total pages correctly', async () => {
      vi.mocked(materialRepository.findMany).mockResolvedValue([])
      vi.mocked(materialRepository.count).mockResolvedValue(50)

      const result = await service.getList({}, { page: 1, pageSize: 20 })

      expect(result.meta.totalPages).toBe(3)
    })
  })

  describe('getById', () => {
    it('should return material by id', async () => {
      const mockMaterial = { id: '1', materialNo: 'M001', name: 'Material 1', unit: 'pcs', price: 100, currency: 'CNY' }
      vi.mocked(materialRepository.findById).mockResolvedValue(mockMaterial)

      const result = await service.getById('1')

      expect(materialRepository.findById).toHaveBeenCalledWith('1')
      expect(result).toEqual(mockMaterial)
    })
  })

  describe('create', () => {
    it('should create material when materialNo is unique', async () => {
      const input = {
        materialNo: 'M001',
        name: 'New Material',
        unit: 'pcs',
        price: 100,
        currency: 'CNY',
        manufacturer: 'Test Corp',
        category: 'raw',
        note: 'Test note',
      }
      const mockMaterial = { id: '1', ...input }
      vi.mocked(materialRepository.findByMaterialNo).mockResolvedValue(null)
      vi.mocked(materialRepository.create).mockResolvedValue(mockMaterial)

      const result = await service.create(input)

      expect(materialRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        materialNo: 'M001',
        name: 'New Material',
        currency: 'CNY',
      }))
      expect(result).toEqual(mockMaterial)
    })

    it('should use default currency CNY when not provided', async () => {
      const input = {
        materialNo: 'M001',
        name: 'New Material',
        unit: 'pcs',
        price: 100,
      }
      vi.mocked(materialRepository.findByMaterialNo).mockResolvedValue(null)
      vi.mocked(materialRepository.create).mockResolvedValue({} as never)

      await service.create(input)

      expect(materialRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        currency: 'CNY',
      }))
    })

    it('should throw DUPLICATE_MATERIAL_NO when materialNo exists', async () => {
      const input = {
        materialNo: 'M001',
        name: 'New Material',
        unit: 'pcs',
        price: 100,
      }
      vi.mocked(materialRepository.findByMaterialNo).mockResolvedValue({ id: '1', materialNo: 'M001' } as never)

      await expect(service.create(input)).rejects.toThrow('DUPLICATE_MATERIAL_NO')
    })
  })

  describe('update', () => {
    it('should update material when found', async () => {
      const input = { name: 'Updated Name', price: 200 }
      const existingMaterial = { id: '1', materialNo: 'M001', name: 'Old Name', price: 100, currency: 'CNY' }
      const { prisma } = await import('@cost/database')
      vi.mocked(materialRepository.findById).mockResolvedValue(existingMaterial as never)
      vi.mocked(materialRepository.findByMaterialNo).mockResolvedValue(null)
      vi.mocked(materialRepository.update).mockResolvedValue({ ...existingMaterial, ...input } as never)
      vi.mocked(prisma.bomMaterial.findMany).mockResolvedValue([])
      vi.mocked(prisma.packagingConfig.findMany).mockResolvedValue([])

      const result = await service.update('1', input)

      expect(materialRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        name: 'Updated Name',
        price: 200,
      }))
      expect(result.name).toBe('Updated Name')
    })

    it('should throw NOT_FOUND when material does not exist', async () => {
      vi.mocked(materialRepository.findById).mockResolvedValue(null)

      await expect(service.update('999', { name: 'Test' })).rejects.toThrow('NOT_FOUND')
    })

    it('should throw DUPLICATE_MATERIAL_NO when new materialNo conflicts', async () => {
      const input = { materialNo: 'M002' }
      const existingMaterial = { id: '1', materialNo: 'M001', name: 'Material 1', price: 100, currency: 'CNY' }
      vi.mocked(materialRepository.findById).mockResolvedValue(existingMaterial as never)
      vi.mocked(materialRepository.findByMaterialNo).mockResolvedValue({ id: '2', materialNo: 'M002' } as never)

      await expect(service.update('1', input)).rejects.toThrow('DUPLICATE_MATERIAL_NO')
    })

    it('should allow updating to same materialNo', async () => {
      const input = { materialNo: 'M001', name: 'Updated' }
      const existingMaterial = { id: '1', materialNo: 'M001', name: 'Material 1', price: 100, currency: 'CNY' }
      vi.mocked(materialRepository.findById).mockResolvedValue(existingMaterial as never)
      vi.mocked(materialRepository.findByMaterialNo).mockResolvedValue(existingMaterial as never)
      vi.mocked(materialRepository.update).mockResolvedValue({} as never)

      await service.update('1', input)

      expect(materialRepository.update).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete material when found', async () => {
      const existingMaterial = { id: '1', materialNo: 'M001' }
      vi.mocked(materialRepository.findById).mockResolvedValue(existingMaterial as never)
      vi.mocked(materialRepository.delete).mockResolvedValue(undefined)

      await service.delete('1')

      expect(materialRepository.delete).toHaveBeenCalledWith('1')
    })

    it('should throw NOT_FOUND when material does not exist', async () => {
      vi.mocked(materialRepository.findById).mockResolvedValue(null)

      await expect(service.delete('999')).rejects.toThrow('NOT_FOUND')
    })
  })
})
