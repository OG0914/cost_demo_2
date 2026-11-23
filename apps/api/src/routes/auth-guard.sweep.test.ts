/**
 * 全量路由鉴权门禁
 *
 * 背景：2026-07 的 system-config 三个端点漏挂 `authenticate`，同时对应测试文件被删除，
 * 导致 `pnpm test` 全绿却实际裸奔。单点测试防不住"测试文件一起被删"，
 * 因此这里改为枚举 `/api/v1` 下**所有**已注册路由，逐个以无 token 请求验证必须 401。
 *
 * 新增路由若属于公开接口，必须显式加入 PUBLIC_ROUTES 白名单。
 */
import { describe, it, expect } from 'vitest'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import { routes } from './index.js'

/** 唯一允许匿名访问的接口：登录 */
const PUBLIC_ROUTES = new Set(['POST /api/v1/auth/login'])

/** 路由数下限：防止路由收集本身失效（例如 onRoute 不再触发）造成门禁假绿 */
const MIN_EXPECTED_ROUTES = 40

const INJECTABLE_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
type InjectableMethod = (typeof INJECTABLE_METHODS)[number]

function toInjectableMethod(method: string): InjectableMethod | null {
  const upper = method.toUpperCase()
  return INJECTABLE_METHODS.find((candidate) => candidate === upper) ?? null
}

interface RouteTarget {
  method: InjectableMethod
  url: string
}

describe('全量路由鉴权门禁', () => {
  it('除白名单外，所有 /api/v1 路由在无 token 时必须返回 401', async () => {
    const app = Fastify()

    const registered: RouteTarget[] = []
    app.addHook('onRoute', (route) => {
      const methods: string[] = Array.isArray(route.method) ? route.method : [route.method]
      for (const raw of methods) {
        const method = toInjectableMethod(raw)
        if (method === null) continue
        registered.push({ method, url: route.url })
      }
    })

    // 与 index.ts 中同名装饰器等价的最小实现：无 token 直接 401
    app.decorate('authenticate', async (_request: FastifyRequest, reply: FastifyReply) => {
      reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } })
    })

    await app.register(routes, { prefix: '/api/v1' })
    await app.ready()

    expect(registered.length).toBeGreaterThanOrEqual(MIN_EXPECTED_ROUTES)

    const targets = registered.filter((route) => !PUBLIC_ROUTES.has(`${route.method} ${route.url}`))
    expect(targets.length).toBeGreaterThanOrEqual(MIN_EXPECTED_ROUTES - 1)

    const unguarded: string[] = []
    for (const { method, url } of targets) {
      const response = await app.inject({
        method,
        // 路径参数替换为探针值，仅用于命中路由
        url: url.replace(/:[^/]+/g, 'guard-probe'),
      })
      if (response.statusCode !== 401) {
        unguarded.push(`${method} ${url} → ${response.statusCode}`)
      }
    }

    await app.close()

    expect(unguarded, `以下路由缺少 authenticate：\n${unguarded.join('\n')}`).toEqual([])
  })
})
