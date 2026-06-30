import {
  STANDARD_BOX,
  BLISTER_BAG,
  calculatePerBox,
  calculatePerCarton,
} from '@cost/shared-types'
import { BaseService } from './base.service.js'
import { packagingRepository, type PackagingConfigFilter, type PaginationParams } from '../repositories/packaging.repository.js'

export interface CreatePackagingConfigInput {
  modelId: string
  name: string
  packagingType: string
  layer1: number
  layer2: number
  layer3?: number | null
}

export interface UpdatePackagingConfigInput {
  name?: string
  packagingType?: string
  layer1?: number
  layer2?: number
  layer3?: number | null
}

export interface CreateProcessInput {
  packagingConfigId: string
  name: string
  price: number
  unit: 'piece' | 'dozen'
  sortOrder?: number
}

export interface UpdateProcessInput {
  name?: string
  price?: number
  unit?: 'piece' | 'dozen'
  sortOrder?: number
}

export interface CreatePackagingMaterialInput {
  packagingConfigId: string
  materialId: string
  quantity: number
  boxLength?: number
  boxWidth?: number
  boxHeight?: number
  boxVolume?: number
}

export interface UpdatePackagingMaterialInput {
  materialId?: string
  quantity?: number
  boxLength?: number
  boxWidth?: number
  boxHeight?: number
  boxVolume?: number
}

export class PackagingService extends BaseService {
  private repository = packagingRepository

  async getList(filter: PackagingConfigFilter, pagination: PaginationParams) {
    const [configs, total] = await Promise.all([
      this.repository.findMany(filter, pagination),
      this.repository.count(filter),
    ])

    return {
      data: configs,
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

  async create(input: CreatePackagingConfigInput) {
    const model = await this.prisma.model.findUnique({
      where: { id: input.modelId },
    })

    if (!model) {
      throw new Error('INVALID_MODEL')
    }

    const isThreeLayer = input.packagingType === STANDARD_BOX || input.packagingType === BLISTER_BAG
    const perBox = isThreeLayer ? calculatePerBox(input.packagingType, input.layer1, input.layer2) : null
    const perCarton = calculatePerCarton(input.layer1, input.layer2, input.layer3)

    return this.repository.create({
      model: { connect: { id: input.modelId } },
      name: input.name,
      packagingType: input.packagingType,
      perBox,
      perCarton,
      layer1: input.layer1,
      layer2: input.layer2,
      layer3: input.layer3 ?? null,
    })
  }

  async update(id: string, input: UpdatePackagingConfigInput) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    const packagingType = input.packagingType ?? existing.packagingType
    const layer1 = input.layer1 ?? existing.layer1
    const layer2 = input.layer2 ?? existing.layer2
    const layer3 = input.layer3 !== undefined ? input.layer3 : existing.layer3

    const isThreeLayer = packagingType === STANDARD_BOX || packagingType === BLISTER_BAG
    const perBox = isThreeLayer ? calculatePerBox(packagingType, layer1, layer2) : null
    const perCarton = calculatePerCarton(layer1, layer2, layer3)

    return this.repository.update(id, {
      name: input.name,
      packagingType: input.packagingType,
      perBox,
      perCarton,
      layer1: input.layer1,
      layer2: input.layer2,
      layer3: input.layer3 !== undefined ? input.layer3 : undefined,
    })
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    await this.repository.delete(id)
  }

  async getProcesses(packagingConfigId: string) {
    const config = await this.repository.findById(packagingConfigId)
    if (!config) {
      throw new Error('NOT_FOUND')
    }

    return this.repository.findProcesses(packagingConfigId)
  }

  async createProcess(input: CreateProcessInput) {
    const config = await this.repository.findById(input.packagingConfigId)
    if (!config) {
      throw new Error('INVALID_CONFIG')
    }

    const lastItem = await this.repository.findLastProcessBySortOrder(input.packagingConfigId)
    const sortOrder = input.sortOrder ?? (lastItem ? lastItem.sortOrder + 1 : 1)

    return this.repository.createProcess({
      packagingConfig: { connect: { id: input.packagingConfigId } },
      name: input.name,
      price: input.price,
      unit: input.unit,
      sortOrder,
    })
  }

  async updateProcess(id: string, input: UpdateProcessInput) {
    const existing = await this.repository.findProcessById(id)
    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    return this.repository.updateProcess(id, {
      name: input.name,
      price: input.price,
      unit: input.unit,
      sortOrder: input.sortOrder,
    })
  }

  async deleteProcess(id: string) {
    const existing = await this.repository.findProcessById(id)
    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    await this.repository.deleteProcess(id)
  }

  async getMaterials(packagingConfigId: string) {
    const config = await this.repository.findById(packagingConfigId)
    if (!config) {
      throw new Error('NOT_FOUND')
    }

    return this.repository.findMaterials(packagingConfigId)
  }

  async createMaterial(input: CreatePackagingMaterialInput) {
    const config = await this.repository.findById(input.packagingConfigId)
    if (!config) {
      throw new Error('INVALID_CONFIG')
    }

    const material = await this.prisma.material.findUnique({
      where: { id: input.materialId },
    })
    if (!material) {
      throw new Error('INVALID_MATERIAL')
    }

    return this.repository.createMaterial({
      packagingConfig: { connect: { id: input.packagingConfigId } },
      material: { connect: { id: input.materialId } },
      quantity: input.quantity,
      boxLength: input.boxLength,
      boxWidth: input.boxWidth,
      boxHeight: input.boxHeight,
      boxVolume: input.boxVolume,
    })
  }

  async updateMaterial(id: string, input: UpdatePackagingMaterialInput) {
    const existing = await this.repository.findMaterialById(id)
    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    if (input.materialId) {
      const material = await this.prisma.material.findUnique({
        where: { id: input.materialId },
      })
      if (!material) {
        throw new Error('INVALID_MATERIAL')
      }
    }

    return this.repository.updateMaterial(id, {
      material: input.materialId ? { connect: { id: input.materialId } } : undefined,
      quantity: input.quantity,
      boxLength: input.boxLength,
      boxWidth: input.boxWidth,
      boxHeight: input.boxHeight,
      boxVolume: input.boxVolume,
    })
  }

  async deleteMaterial(id: string) {
    const existing = await this.repository.findMaterialById(id)
    if (!existing) {
      throw new Error('NOT_FOUND')
    }

    await this.repository.deleteMaterial(id)
  }
}

export const packagingService = new PackagingService()
