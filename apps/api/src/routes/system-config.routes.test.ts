import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'

vi.mock('../controllers/system-config.controller.js', () => ({
  systemConfigController: {
    getList: vi.fn(async (_req: unknown, reply: { send: (p: unknown) => void }) =>
      reply.send({ success: true, data: [] })),
    getByKey: vi.fn(async (_req: unknown, reply: { send: (p: unknown) => void }) =>
      reply.send({ success: true, data: {} })),
    update: vi.fn(async (_req: unknown, reply: { send: (p: unknown) => void }) =>
      reply.send({ success: true, data: {} })),
  },
}))

import { systemConfigRoutes } from './system-config.routes.js'
import { systemConfigController } from '../controllers/system-config.controller.js'

describe('systemConfigRoutes 鉴权', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    app = Fastify()
    app.decorate('authenticate', async (request, reply) => {  // 模拟全局鉴权：无 token 一律 401
      if (!request.headers.authorization) {
        await reply.status(401).send({ success: false, message: '未登录' })
      }
    })
    await app.register(systemConfigRoutes, { prefix: '/system-configs' })
  })

  it('GET /system-configs 无 token 应返回 401', async () => {
    const response = await app.inject({ method: 'GET', url: '/system-configs' })
    expect(response.statusCode).toBe(401)
    expect(systemConfigController.getList).not.toHaveBeenCalled()
  })

  it('GET /system-configs/:key 无 token 应返回 401', async () => {
    const response = await app.inject({ method: 'GET', url: '/system-configs/vatRate' })
    expect(response.statusCode).toBe(401)
    expect(systemConfigController.getByKey).not.toHaveBeenCalled()
  })

  it('PUT /system-configs/:key 无 token 应返回 401', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/system-configs/vatRate',
      payload: { value: 0.13 },
    })
    expect(response.statusCode).toBe(401)
    expect(systemConfigController.update).not.toHaveBeenCalled()
  })

  it('带 token 的请求应到达 controller', async () => {
    const headers = { authorization: 'Bearer fake-token' }

    const listRes = await app.inject({ method: 'GET', url: '/system-configs', headers })
    const getRes = await app.inject({ method: 'GET', url: '/system-configs/vatRate', headers })
    const putRes = await app.inject({ method: 'PUT', url: '/system-configs/vatRate', headers, payload: { value: 0.13 } })

    expect(listRes.statusCode).toBe(200)
    expect(getRes.statusCode).toBe(200)
    expect(putRes.statusCode).toBe(200)
    expect(systemConfigController.getList).toHaveBeenCalledTimes(1)
    expect(systemConfigController.getByKey).toHaveBeenCalledTimes(1)
    expect(systemConfigController.update).toHaveBeenCalledTimes(1)
  })
})
