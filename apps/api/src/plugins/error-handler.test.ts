import { describe, it, expect, beforeEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import errorHandler from './error-handler.js'

/** 构造一个 Prisma P2003 外键错误（与真实 Prisma 6 返回结构一致） */
function prismaForeignKeyError(constraint: string) {
  return Object.assign(new Error('Foreign key constraint violated'), {
    code: 'P2003',
    meta: { modelName: 'Regulation', constraint },
  })
}

describe('error-handler 外键冲突映射', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify()
    await app.register(errorHandler)
  })

  it('DELETE 撞上已知外键约束时返回 409 并说明被什么引用', async () => {
    app.delete('/regulations/:id', async () => {
      throw prismaForeignKeyError('models_regulation_id_fkey')
    })

    const response = await app.inject({ method: 'DELETE', url: '/regulations/1' })

    expect(response.statusCode).toBe(409)
    expect(response.json().error.code).toBe('RESOURCE_CONFLICT')
    expect(response.json().error.message).toBe('该法规仍被型号引用，请先解除型号关联')
  })

  it('DELETE 撞上未登记的外键约束时返回 409 与通用提示', async () => {
    app.delete('/anything/:id', async () => {
      throw prismaForeignKeyError('some_unknown_fkey')
    })

    const response = await app.inject({ method: 'DELETE', url: '/anything/1' })

    expect(response.statusCode).toBe(409)
    expect(response.json().error.message).toBe('该记录仍被其他业务数据引用，请先解除引用后再删除')
  })

  it('非 DELETE 请求的外键错误仍按 400 处理（引用的数据不存在）', async () => {
    app.post('/bom', async () => {
      throw prismaForeignKeyError('bom_materials_material_id_fkey')
    })

    const response = await app.inject({ method: 'POST', url: '/bom' })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.message).toBe('引用的关联数据不存在或已被删除')
  })
})
