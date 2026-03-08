import { BaseService } from './base.service.js'
import { materialRepository, type MaterialFilter, type PaginationParams } from '../repositories/material.repository.js'
import { createCacheService, CacheNamespaces } from './cache.service.js'
import { redisConfig } from '../config/redis.js'
import type { CreateMaterialInput, UpdateMaterialInput } from '../lib/schemas.js'

// 缓存服务实例
const materialCache = createCacheService(CacheNamespaces.MATERIAL)

// 生成列表缓存键
function generateListCacheKey(filter: MaterialFilter, pagination: PaginationParams): string {
  const filterKey = JSON.stringify({ ...filter, ...pagination })
  return `list:${Buffer.from(filterKey).toString('base64')}`
}

// 生成单条记录缓存键
function generateDetailCacheKey(id: string): string {
  return `detail:${id}`
}

export class MaterialService extends BaseService {
  private repository = materialRepository

  async getList(filter: MaterialFilter, pagination: PaginationParams) {
    const cacheKey = generateListCacheKey(filter, pagination)

    const cached = await materialCache.get<{
      data: unknown[]
      meta: { page: number; pageSize: number; total: number; totalPages: number }
    }>(cacheKey)

    if (cached) {
      return cached
    }

    const [materials, total] = await Promise.all([
      this.repository.findMany(filter, pagination),
      this.repository.count(filter),
    ])

    const result = {
      data: materials,
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    }

    await materialCache.set(cacheKey, result, redisConfig.ttl.baseData)
    return result
  }

  async getById(id: string) {
    const cacheKey = generateDetailCacheKey(id)

    const cached = await materialCache.get<unknown>(cacheKey)
    if (cached) {
      return cached
    }

    const material = await this.repository.findById(id)
    if (material) {
      await materialCache.set(cacheKey, material, redisConfig.ttl.baseData)
    }
    return material
  }

  async create(input: CreateMaterialInput) {
    const existing = await this.repository.findByMaterialNo(input.materialNo)
    if (existing) {
      throw new Error('DUPLICATE_MATERIAL_NO')
    }

    const result = await this.repository.create({
      materialNo: input.materialNo,
      name: input.name,
      unit: input.unit,
      price: input.price,
      currency: input.currency || 'CNY',
      manufacturer: input.manufacturer,
      category: input.category,
      note: input.note,
    })

    // 清除列表缓存
    await materialCache.delPattern('list:*')

    return result
  }

  async update(id: string, input: UpdateMaterialInput) {
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

    const updated = await this.repository.update(id, {
      materialNo: input.materialNo,
      name: input.name,
      unit: input.unit,
      price: input.price,
      currency: input.currency,
      manufacturer: input.manufacturer,
      category: input.category,
      note: input.note,
    })

    if (input.price !== undefined && input.price !== Number(existing.price)) {
      await this.createPriceChangeNotification(id, Number(existing.price), input.price)
    }

    // 清除相关缓存
    await materialCache.del(generateDetailCacheKey(id))
    await materialCache.delPattern('list:*')

    return updated
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    await this.repository.delete(id)

    // 清除相关缓存
    await materialCache.del(generateDetailCacheKey(id))
    await materialCache.delPattern('list:*')
  }

  private async createPriceChangeNotification(materialId: string, oldPrice: number, newPrice: number) {
    const affectedBoms = await this.prisma.bomMaterial.findMany({
      where: { materialId },
      include: { model: true },
    })

    const packagingConfigIds = await this.prisma.packagingConfig.findMany({
      where: {
        modelId: { in: affectedBoms.map((b) => b.modelId) },
      },
      select: { id: true },
    })

    if (packagingConfigIds.length > 0) {
      await this.prisma.notification.create({
        data: {
          type: 'price_change',
          status: 'pending',
          materialId,
          oldPrice,
          newPrice,
          affectedStandardCosts: packagingConfigIds.map((p) => p.id),
          triggeredBy: '',
        },
      })
    }
  }
}

export const materialService = new MaterialService()
