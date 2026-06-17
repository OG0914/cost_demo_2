import { BaseService } from './base.service.js'
import { materialRepository, type MaterialFilter, type PaginationParams } from '../repositories/material.repository.js'
import type { CreateMaterialInput, UpdateMaterialInput } from '../lib/schemas.js'
import type { Prisma } from '@cost/database'

export class MaterialService extends BaseService {
  private repository = materialRepository

  async getList(filter: MaterialFilter, pagination: PaginationParams) {
    const [materials, total] = await Promise.all([
      this.repository.findMany(filter, pagination),
      this.repository.count(filter),
    ])

    return {
      data: materials,
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    }
  }

  async getById(id: string) {
    return this.repository.findById(id)
  }

  async create(input: CreateMaterialInput) {
    const existing = await this.repository.findByMaterialNo(input.materialNo)
    if (existing) {
      throw new Error('DUPLICATE_MATERIAL_NO')
    }

    return this.repository.create({
      materialNo: input.materialNo,
      name: input.name,
      unit: input.unit,
      price: input.price,
      currency: input.currency || 'CNY',
      manufacturer: input.manufacturer,
      category: input.category,
      note: input.note,
    })
  }

  async update(id: string, input: UpdateMaterialInput, userId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    if (input.materialNo && input.materialNo !== existing.materialNo) {
      const duplicate = await this.repository.findByMaterialNo(input.materialNo)
      if (duplicate && duplicate.id !== id) {
        throw new Error('DUPLICATE_MATERIAL_NO')
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.material.update({
        where: { id },
        data: {
          materialNo: input.materialNo,
          name: input.name,
          unit: input.unit,
          price: input.price,
          currency: input.currency,
          manufacturer: input.manufacturer,
          category: input.category,
          note: input.note,
        },
      })

      if (input.price !== undefined && input.price !== Number(existing.price)) {
        await this.createPriceChangeNotification(tx, id, Number(existing.price), input.price, userId)
      }

      return updated
    })
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    await this.repository.delete(id)
  }

  private async createPriceChangeNotification(
    tx: Prisma.TransactionClient,
    materialId: string,
    oldPrice: number,
    newPrice: number,
    userId: string,
  ) {
    const affectedBoms = await tx.bomMaterial.findMany({
      where: { materialId },
      include: { model: true },
    })

    const packagingConfigIds = await tx.packagingConfig.findMany({
      where: {
        modelId: { in: affectedBoms.map((b) => b.modelId) },
      },
      select: { id: true },
    })

    if (packagingConfigIds.length > 0) {
      await tx.notification.create({
        data: {
          type: 'price_change',
          status: 'pending',
          materialId,
          oldPrice,
          newPrice,
          affectedStandardCosts: packagingConfigIds.map((p) => p.id),
          triggeredBy: userId,
        },
      })
    }
  }
}

export const materialService = new MaterialService()
