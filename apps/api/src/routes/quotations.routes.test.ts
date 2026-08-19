import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'

const ok = (data: unknown) => async (_req: unknown, reply: { send: (p: unknown) => void }) =>
  reply.send({ success: true, data })

vi.mock('../controllers/quotation.controller.js', () => ({
  quotationController: {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(async (_req: unknown, reply: { code: (n: number) => { send: (p: unknown) => void } }) =>
      reply.code(201).send({ success: true, data: { id: 'new-id' } })),
    update: vi.fn(),
    delete: vi.fn(),
    submit: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    calculate: vi.fn(),
  },
}))

import { quotationRoutes } from './quotations.routes.js'
import { quotationController } from '../controllers/quotation.controller.js'

const AUTH = { authorization: 'Bearer fake-token' }

// 后端 repository 返回的完整行（含关联对象），用于验证响应 schema 不裁剪字段
const fullRow = {
  id: '00000000-0000-0000-0000-000000000010',
  quotationNo: 'QT-2026-0001',
  customerId: '00000000-0000-0000-0000-000000000001',
  regulationId: '00000000-0000-0000-0000-000000000002',
  modelId: '00000000-0000-0000-0000-000000000003',
  packagingConfigId: '00000000-0000-0000-0000-000000000004',
  saleType: 'domestic',
  shippingType: 'fcl20',
  quantity: 1000,
  materialCost: 23700,
  packagingCost: 0,
  processCost: 0,
  shippingCost: 0,
  adminFee: 2370,
  vat: 3389.1,
  totalCost: 29459.1,
  status: 'submitted',
  createdBy: '00000000-0000-0000-0000-000000000005',
  createdAt: '2026-08-19T00:19:15.019Z',
  updatedAt: '2026-08-19T00:19:15.066Z',
  reviewedBy: null,
  reviewedAt: null,
  reviewNote: null,
  customer: { id: '00000000-0000-0000-0000-000000000001', code: 'VC001', name: '3M中国', region: '上海' },
  regulation: { id: '00000000-0000-0000-0000-000000000002', name: 'GB2626' },
  model: { id: '00000000-0000-0000-0000-000000000003', name: 'N95口罩', series: '防颗粒物', category: 'mask' },
  packagingConfig: { id: '00000000-0000-0000-0000-000000000004', name: '标准箱装' },
}

describe('quotationRoutes 响应序列化', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    app = Fastify()
    app.decorate('authenticate', async (request, reply) => {  // 模拟全局鉴权：无 token 一律 401
      if (!request.headers.authorization) {
        await reply.status(401).send({ success: false, message: '未登录' })
      }
    })
    await app.register(quotationRoutes, { prefix: '/quotations' })
  })

  it('GET /quotations 列表响应应保留 quotationNo 与关联对象', async () => {
    vi.mocked(quotationController.getList).mockImplementation(
      ok([fullRow]) as never
    )

    const response = await app.inject({ method: 'GET', url: '/quotations', headers: AUTH })
    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.data[0].quotationNo).toBe('QT-2026-0001')
    expect(body.data[0].customer.name).toBe('3M中国')
    expect(body.data[0].regulation.name).toBe('GB2626')
    expect(body.data[0].model.name).toBe('N95口罩')
  })

  it('GET /quotations/:id 详情响应应保留 quotationNo 与关联对象', async () => {
    vi.mocked(quotationController.getById).mockImplementation(ok(fullRow) as never)

    const response = await app.inject({
      method: 'GET',
      url: '/quotations/00000000-0000-0000-0000-000000000010',
      headers: AUTH,
    })
    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.data.quotationNo).toBe('QT-2026-0001')
    expect(body.data.customer.name).toBe('3M中国')
    expect(body.data.packagingConfig.name).toBe('标准箱装')
  })

  it('POST /quotations 仅传 customerName（无 customerId）应通过校验', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/quotations',
      headers: AUTH,
      payload: {
        customerName: '新客户公司',
        regulationId: '00000000-0000-0000-0000-000000000002',
        modelId: '00000000-0000-0000-0000-000000000003',
        packagingConfigId: '00000000-0000-0000-0000-000000000004',
        saleType: 'domestic',
        shippingType: 'fcl20',
        quantity: 100,
        materialCost: 1000,
        packagingCost: 200,
        processCost: 300,
        shippingCost: 400,
        adminFee: 50,
        vat: 130,
        totalCost: 2080,
      },
    })

    expect(response.statusCode).toBe(201)
    expect(quotationController.create).toHaveBeenCalledTimes(1)
  })
})
