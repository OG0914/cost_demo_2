import { redisClient, generateCacheKey, redisConfig } from '../config/redis.js'

// 缓存服务类
export class CacheService {
  private namespace: string

  constructor(namespace: string = 'default') {
    this.namespace = namespace
  }

  // 获取缓存值
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = generateCacheKey(this.namespace, key)
      const value = await redisClient.get(fullKey)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`[Cache] 获取缓存失败 [${key}]:`, error)
      return null
    }
  }

  // 设置缓存值
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const fullKey = generateCacheKey(this.namespace, key)
      const serialized = JSON.stringify(value)
      const expireTime = ttlSeconds ?? redisConfig.ttl.default

      if (expireTime > 0) {
        await redisClient.setex(fullKey, expireTime, serialized)
      } else {
        await redisClient.set(fullKey, serialized)
      }
    } catch (error) {
      console.error(`[Cache] 设置缓存失败 [${key}]:`, error)
    }
  }

  // 删除缓存
  async del(key: string): Promise<void> {
    try {
      const fullKey = generateCacheKey(this.namespace, key)
      await redisClient.del(fullKey)
    } catch (error) {
      console.error(`[Cache] 删除缓存失败 [${key}]:`, error)
    }
  }

  // 根据模式删除缓存
  async delPattern(pattern: string): Promise<void> {
    try {
      const fullPattern = generateCacheKey(this.namespace, pattern)
      const keys = await redisClient.keys(fullPattern)
      if (keys.length > 0) {
        await redisClient.del(...keys)
      }
    } catch (error) {
      console.error(`[Cache] 批量删除缓存失败 [${pattern}]:`, error)
    }
  }

  // 清空当前命名空间的所有缓存
  async flush(): Promise<void> {
    try {
      const pattern = generateCacheKey(this.namespace, '*')
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(...keys)
      }
    } catch (error) {
      console.error(`[Cache] 清空缓存失败 [${this.namespace}]:`, error)
    }
  }

  // 检查缓存是否存在
  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = generateCacheKey(this.namespace, key)
      const result = await redisClient.exists(fullKey)
      return result === 1
    } catch (error) {
      console.error(`[Cache] 检查缓存失败 [${key}]:`, error)
      return false
    }
  }

  // 获取缓存剩余时间（秒）
  async ttl(key: string): Promise<number> {
    try {
      const fullKey = generateCacheKey(this.namespace, key)
      return await redisClient.ttl(fullKey)
    } catch (error) {
      console.error(`[Cache] 获取TTL失败 [${key}]:`, error)
      return -1
    }
  }

  // 获取或设置缓存（缓存穿透保护）
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await factory()
    await this.set(key, value, ttlSeconds)
    return value
  }
}

// 预定义的命名空间
export const CacheNamespaces = {
  DASHBOARD: 'dashboard',      // 仪表盘数据
  MATERIAL: 'material',        // 物料数据
  CUSTOMER: 'customer',        // 客户数据
  MODEL: 'model',              // 型号数据
  PACKAGING: 'packaging',      // 包装配置
  REGULATION: 'regulation',    // 法规数据
  USER: 'user',                // 用户数据
  SESSION: 'session',          // 会话数据
  QUOTATION: 'quotation',      // 报价单数据
} as const

// 导出单例实例
export const cacheService = new CacheService()

// 导出命名空间特定的缓存服务工厂
export function createCacheService(namespace: string): CacheService {
  return new CacheService(namespace)
}
