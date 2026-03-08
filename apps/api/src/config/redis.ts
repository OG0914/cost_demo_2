import { Redis } from 'ioredis'

// Redis 连接配置
export interface RedisConfig {
  url: string
  host: string
  port: number
  password?: string
  db: number
  keyPrefix: string
  ttl: {
    dashboard: number      // 仪表盘数据缓存时间（秒）
    baseData: number       // 基础数据缓存时间（秒）
    session: number        // 会话缓存时间（秒）
    default: number        // 默认缓存时间（秒）
  }
}

// 从环境变量读取配置
export const redisConfig: RedisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'cost:api:',
  ttl: {
    dashboard: parseInt(process.env.REDIS_TTL_DASHBOARD || '300', 10),      // 5分钟
    baseData: parseInt(process.env.REDIS_TTL_BASEDATA || '600', 10),        // 10分钟
    session: parseInt(process.env.REDIS_TTL_SESSION || '604800', 10),       // 7天
    default: parseInt(process.env.REDIS_TTL_DEFAULT || '300', 10),          // 5分钟
  }
}

// 创建 Redis 客户端实例
export const redisClient = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
  keyPrefix: redisConfig.keyPrefix,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
})

// 连接事件监听
redisClient.on('connect', () => {
  console.log('[Redis] 连接成功')
})

redisClient.on('error', (err: Error) => {
  console.error('[Redis] 连接错误:', err.message)
})

redisClient.on('reconnecting', () => {
  console.log('[Redis] 正在重新连接...')
})

// 生成带命名空间的缓存键
export function generateCacheKey(namespace: string, key: string): string {
  return `${namespace}:${key}`
}

// 关闭连接
export async function closeRedisConnection(): Promise<void> {
  await redisClient.quit()
}
