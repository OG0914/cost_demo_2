import type { Customer, Prisma } from '@cost/database'
import { BaseService } from './base.service.js'
import { customerRepository, type CustomerFilter } from '../repositories/customer.repository.js'
import { createCacheService, CacheNamespaces } from './cache.service.js'
import { redisConfig } from '../config/redis.js'
import type { PaginationParams, PaginatedResult } from '../repositories/user.repository.js'

export interface CreateCustomerInput {
  code: string
  name: string
  region: string
  note?: string
  createdBy: string
}

export interface UpdateCustomerInput {
  code?: string
  name?: string
  region?: string
  note?: string
  updatedBy: string
}

// 缓存服务实例
const customerCache = createCacheService(CacheNamespaces.CUSTOMER)

// 生成列表缓存键
function generateListCacheKey(filter: CustomerFilter, params: PaginationParams): string {
  const filterKey = JSON.stringify({ ...filter, ...params })
  return `list:${Buffer.from(filterKey).toString('base64')}`
}

// 生成单条记录缓存键
function generateDetailCacheKey(id: string): string {
  return `detail:${id}`
}

export class CustomerService extends BaseService {
  async getList(filter: CustomerFilter, params: PaginationParams): Promise<PaginatedResult<Customer>> {
    const cacheKey = generateListCacheKey(filter, params)

    const cached = await customerCache.get<PaginatedResult<Customer>>(cacheKey)
    if (cached) {
      return cached
    }

    const result = await customerRepository.findMany(filter, params)
    await customerCache.set(cacheKey, result, redisConfig.ttl.baseData)
    return result
  }

  async getById(id: string): Promise<Customer | null> {
    const cacheKey = generateDetailCacheKey(id)

    const cached = await customerCache.get<Customer>(cacheKey)
    if (cached) {
      return cached
    }

    const customer = await customerRepository.findById(id)
    if (customer) {
      await customerCache.set(cacheKey, customer, redisConfig.ttl.baseData)
    }
    return customer
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const { createdBy, ...data } = input

    const createData: Prisma.CustomerCreateInput = {
      ...data,
      createdByUser: { connect: { id: createdBy } },
      updatedByUser: { connect: { id: createdBy } },
    }

    const result = await customerRepository.create(createData)

    // 清除列表缓存
    await customerCache.delPattern('list:*')

    return result
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const { updatedBy, ...data } = input

    const updateData: Prisma.CustomerUpdateInput = {
      ...data,
      updatedByUser: { connect: { id: updatedBy } },
    }

    const result = await customerRepository.update(id, updateData)

    // 清除相关缓存
    await customerCache.del(generateDetailCacheKey(id))
    await customerCache.delPattern('list:*')

    return result
  }

  async delete(id: string): Promise<void> {
    await customerRepository.delete(id)

    // 清除相关缓存
    await customerCache.del(generateDetailCacheKey(id))
    await customerCache.delPattern('list:*')
  }
}

export const customerService = new CustomerService()
