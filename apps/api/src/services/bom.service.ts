import { prisma } from '@cost/database'
import type { CopyBomRequest } from '@cost/shared-types'

export class BomService {
  async copyBom(data: CopyBomRequest) {
    const { sourceModelId, targetModelId } = data

    // 验证源型号和目标型号存在
    const [sourceModel, targetModel] = await Promise.all([
      prisma.model.findUnique({ where: { id: sourceModelId } }),
      prisma.model.findUnique({ where: { id: targetModelId } }),
    ])

    if (!sourceModel) {
      throw new Error('SOURCE_MODEL_NOT_FOUND')
    }
    if (!targetModel) {
      throw new Error('TARGET_MODEL_NOT_FOUND')
    }

    // 获取源型号的所有 BOM 物料
    const sourceBomMaterials = await prisma.bomMaterial.findMany({
      where: { modelId: sourceModelId },
      orderBy: { sortOrder: 'asc' },
    })

    // 事务：删除目标型号现有 BOM + 批量创建新 BOM
    const result = await prisma.$transaction(async (tx) => {
      // 删除目标型号现有 BOM
      await tx.bomMaterial.deleteMany({
        where: { modelId: targetModelId },
      })

      // 批量创建相同物料记录（新 sortOrder 从 1 开始）
      const newBomMaterials = await Promise.all(
        sourceBomMaterials.map((item, index) =>
          tx.bomMaterial.create({
            data: {
              modelId: targetModelId,
              materialId: item.materialId,
              quantity: item.quantity,
              sortOrder: index + 1,
            },
          })
        )
      )

      return newBomMaterials
    })

    return result
  }
}

export const bomService = new BomService()
