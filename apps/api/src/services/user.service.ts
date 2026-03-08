import bcrypt from 'bcryptjs'
import type { Prisma, Role, UserStatus } from '@cost/database'
import { BaseService } from './base.service.js'
import { userRepository, type PaginationParams, type PaginatedResult } from '../repositories/user.repository.js'
import { createCacheService, CacheNamespaces } from './cache.service.js'
import { redisConfig } from '../config/redis.js'
import type { User } from '@cost/database'

export interface CreateUserInput {
  username: string
  password: string
  name: string
  email: string
  role: Role
  status?: UserStatus
}

export interface UpdateUserInput {
  name?: string
  email?: string
  role?: Role
  status?: UserStatus
}

const USER_SELECT_FIELDS = {
  id: true,
  username: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

type UserResult = Pick<User, keyof typeof USER_SELECT_FIELDS>

// 缓存服务实例
const userCache = createCacheService(CacheNamespaces.USER)

// 生成列表缓存键
function generateListCacheKey(params: PaginationParams): string {
  const key = JSON.stringify(params)
  return `list:${Buffer.from(key).toString('base64')}`
}

// 生成单条记录缓存键
function generateDetailCacheKey(id: string): string {
  return `detail:${id}`
}

export class UserService extends BaseService {
  async getList(params: PaginationParams): Promise<PaginatedResult<UserResult>> {
    const cacheKey = generateListCacheKey(params)

    const cached = await userCache.get<PaginatedResult<UserResult>>(cacheKey)
    if (cached) {
      return cached
    }

    const result = await userRepository.findMany(params)
    await userCache.set(cacheKey, result, redisConfig.ttl.baseData)
    return result
  }

  async getById(id: string): Promise<UserResult | null> {
    const cacheKey = generateDetailCacheKey(id)

    const cached = await userCache.get<UserResult>(cacheKey)
    if (cached) {
      return cached
    }

    const user = await userRepository.findById(id)
    if (user) {
      await userCache.set(cacheKey, user, redisConfig.ttl.baseData)
    }
    return user
  }

  async create(input: CreateUserInput): Promise<UserResult> {
    const hashedPassword = await bcrypt.hash(input.password, 10) // 密码加密

    const createData: Prisma.UserCreateInput = {
      username: input.username,
      password: hashedPassword,
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status || 'active',
    }

    const result = await userRepository.create(createData)

    // 清除列表缓存
    await userCache.delPattern('list:*')

    return result
  }

  async update(id: string, input: UpdateUserInput): Promise<UserResult> {
    const updateData: Prisma.UserUpdateInput = {
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status,
    }

    const result = await userRepository.update(id, updateData)

    // 清除相关缓存
    await userCache.del(generateDetailCacheKey(id))
    await userCache.delPattern('list:*')

    return result
  }

  async delete(id: string): Promise<void> {
    await userRepository.delete(id)

    // 清除相关缓存
    await userCache.del(generateDetailCacheKey(id))
    await userCache.delPattern('list:*')
  }
}

export const userService = new UserService()
