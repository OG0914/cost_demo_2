import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { cacheService, CacheNamespaces, createCacheService } from '../services/cache.service.js'

// 缓存插件选项
export interface CachePluginOptions {
  enabled?: boolean
}

// 缓存装饰器选项
export interface CacheOptions {
  namespace: string
  key: string | ((request: FastifyRequest) => string)
  ttl?: number
  condition?: (request: FastifyRequest) => boolean
}

// 声明模块扩展
declare module 'fastify' {
  interface FastifyInstance {
    cache: typeof cacheService
    withCache: <T>(
      namespace: string,
      key: string,
      factory: () => Promise<T>,
      ttl?: number
    ) => Promise<T>
  }

  interface FastifyRequest {
    cacheKey?: string
  }
}

// 缓存插件
const cachePlugin: FastifyPluginAsync<CachePluginOptions> = async (
  fastify: FastifyInstance,
  options: CachePluginOptions = {}
) => {
  const { enabled = true } = options

  if (!enabled) {
    fastify.log.info('[Cache] 缓存插件已禁用')
    return
  }

  // 装饰 Fastify 实例
  fastify.decorate('cache', cacheService)

  // 装饰 withCache 方法
  fastify.decorate('withCache', async function<T>(
    this: FastifyInstance,
    namespace: string,
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const service = createCacheService(namespace)
    return service.getOrSet(key, factory, ttl)
  })

  fastify.log.info('[Cache] 缓存插件已加载')
}

// 创建路由缓存钩子
export function createCacheHook(options: CacheOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const cacheKey = typeof options.key === 'function'
      ? options.key(request)
      : options.key

    // 检查条件
    if (options.condition && !options.condition(request)) {
      return
    }

    const service = createCacheService(options.namespace)
    const cached = await service.get<unknown>(cacheKey)

    if (cached !== null) {
      reply.header('X-Cache', 'HIT')
      reply.send({
        success: true,
        data: cached,
        cached: true
      })
      return
    }

    // 存储缓存键供后续使用
    request.cacheKey = cacheKey
  }
}

// 创建缓存响应钩子
export function createCacheResponseHook(options: CacheOptions) {
  return async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    if (!request.cacheKey) return payload

    const service = createCacheService(options.namespace)
    await service.set(request.cacheKey, payload, options.ttl)

    reply.header('X-Cache', 'MISS')
    return payload
  }
}

// 清除缓存辅助函数
export async function clearCache(namespace: string, pattern?: string): Promise<void> {
  const service = createCacheService(namespace)
  if (pattern) {
    await service.delPattern(pattern)
  } else {
    await service.flush()
  }
}

// 导出命名空间常量
export { CacheNamespaces }

export default fp(cachePlugin, {
  name: 'cache',
  fastify: '5.x'
})
