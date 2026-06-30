import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bomService } from './bom.service.js'
import { prisma } from '@cost/database'

vi.mock('@cost/database', () => ({
  prisma: {
    model: {
      findUnique: vi.fn(),
    },
    bomMaterial: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe('BomService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('copyBom', () => {
    it('should copy BOM from source to target model', async () => {
      const sourceModelId = 'source-uuid'
      const targetModelId = 'target-uuid'

      vi.mocked(prisma.model.findUnique).mockResolvedValueOnce({ id: sourceModelId } as never)
      vi.mocked(prisma.model.findUnique).mockResolvedValueOnce({ id: targetModelId } as never)

      const sourceBom = [
        { id: 'bom1', modelId: sourceModelId, materialId: 'mat1', quantity: 1.5, sortOrder: 1 },
        { id: 'bom2', modelId: sourceModelId, materialId: 'mat2', quantity: 2.0, sortOrder: 2 },
      ]
      vi.mocked(prisma.bomMaterial.findMany).mockResolvedValueOnce(sourceBom as never)

      const createdBom = [
        { id: 'new1', modelId: targetModelId, materialId: 'mat1', quantity: 1.5, sortOrder: 1 },
        { id: 'new2', modelId: targetModelId, materialId: 'mat2', quantity: 2.0, sortOrder: 2 },
      ]

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback(prisma)
      })

      vi.mocked(prisma.bomMaterial.deleteMany).mockResolvedValueOnce({ count: 0 } as never)
      vi.mocked(prisma.bomMaterial.create).mockResolvedValueOnce(createdBom[0] as never)
      vi.mocked(prisma.bomMaterial.create).mockResolvedValueOnce(createdBom[1] as never)

      const result = await bomService.copyBom({ sourceModelId, targetModelId })

      expect(prisma.model.findUnique).toHaveBeenCalledTimes(2)
      expect(prisma.bomMaterial.findMany).toHaveBeenCalledWith({
        where: { modelId: sourceModelId },
        orderBy: { sortOrder: 'asc' },
      })
      expect(prisma.bomMaterial.deleteMany).toHaveBeenCalledWith({
        where: { modelId: targetModelId },
      })
      expect(prisma.bomMaterial.create).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(2)
    })

    it('should throw error when source model not found', async () => {
      vi.mocked(prisma.model.findUnique).mockResolvedValueOnce(null)

      await expect(bomService.copyBom({
        sourceModelId: 'invalid',
        targetModelId: 'target-uuid',
      })).rejects.toThrow('SOURCE_MODEL_NOT_FOUND')
    })

    it('should throw error when target model not found', async () => {
      vi.mocked(prisma.model.findUnique).mockResolvedValueOnce({ id: 'source' } as never)
      vi.mocked(prisma.model.findUnique).mockResolvedValueOnce(null)

      await expect(bomService.copyBom({
        sourceModelId: 'source-uuid',
        targetModelId: 'invalid',
      })).rejects.toThrow('TARGET_MODEL_NOT_FOUND')
    })
  })
})
