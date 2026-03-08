import type { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma, type SaleType } from '@cost/database'
import {
  standardCostSchema,
  errorResponseSchema,
  paginatedMetaSchema,
  uuidParamSchema,
} from '../lib/swagger-schemas.js'

const standardCostQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1, description: '页码' },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: '每页数量' },
    packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID筛选' },
    saleType: { type: 'string', enum: ['domestic', 'export'], description: '销售类型筛选' },
  },
} as const

const createStandardCostRequestSchema = {
  type: 'object',
  required: ['packagingConfigId', 'saleType', 'materialCost', 'packagingCost', 'processCost', 'shippingCost', 'adminFee', 'vat', 'totalCost'],
  properties: {
    packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID' },
    saleType: { type: 'string', enum: ['domestic', 'export'], description: '销售类型' },
    materialCost: { type: 'number', minimum: 0, description: '物料成本' },
    packagingCost: { type: 'number', minimum: 0, description: '包装成本' },
    processCost: { type: 'number', minimum: 0, description: '工序成本' },
    shippingCost: { type: 'number', minimum: 0, description: '运输成本' },
    adminFee: { type: 'number', minimum: 0, description: '管理费' },
    vat: { type: 'number', minimum: 0, description: '增值税' },
    totalCost: { type: 'number', minimum: 0, description: '总成本' },
  },
} as const

export const standardCostRoutes = async (app: FastifyInstance) => {
  const getUserId = (request: FastifyRequest) => request.user.userId

  // GET /api/v1/standard-costs
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['StandardCosts'],
      summary: '获取标准成本列表',
      description: '获取所有标准成本的列表（分页、筛选）',
      security: [{ bearerAuth: [] }],
      querystring: standardCostQuerySchema,
      response: {
        200: {
          description: '成功获取标准成本列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: standardCostSchema,
            },
            meta: paginatedMetaSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request) => {
    const { page = '1', pageSize = '20', packagingConfigId = '', saleType = '' } = request.query as Record<string, string>

    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10)
    const take = parseInt(pageSize, 10)

    const where: {
      packagingConfigId?: string
      saleType?: SaleType
    } = {}

    if (packagingConfigId) where.packagingConfigId = packagingConfigId
    if (saleType) where.saleType = saleType as SaleType

    const [standardCosts, total] = await Promise.all([
      prisma.standardCost.findMany({
        where,
        skip,
        take,
        include: {
          packagingConfig: {
            include: {
              model: true,
            },
          },
          setByUser: {
            select: { id: true, name: true },
          },
        },
        orderBy: { setAt: 'desc' },
      }),
      prisma.standardCost.count({ where }),
    ])

    return {
      success: true,
      data: standardCosts,
      meta: {
        page: parseInt(page, 10),
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  })

  // GET /api/v1/standard-costs/:id
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['StandardCosts'],
      summary: '获取标准成本详情',
      description: '根据 ID 获取标准成本详细信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取标准成本详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: standardCostSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '标准成本不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const standardCost = await prisma.standardCost.findUnique({
      where: { id },
      include: {
        packagingConfig: {
          include: {
            model: true,
          },
        },
        setByUser: {
          select: { id: true, name: true },
        },
      },
    })

    if (!standardCost) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '标准成本不存在' },
      })
    }

    return { success: true, data: standardCost }
  })

  // POST /api/v1/standard-costs
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['StandardCosts'],
      summary: '创建标准成本',
      description: '创建新的标准成本版本',
      security: [{ bearerAuth: [] }],
      body: createStandardCostRequestSchema,
      response: {
        201: {
          description: '标准成本创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: standardCostSchema,
          },
        },
        400: {
          description: '验证错误或包装配置不存在',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const userId = getUserId(request)
    const {
      packagingConfigId,
      saleType,
      materialCost,
      packagingCost,
      processCost,
      shippingCost,
      adminFee,
      vat,
      totalCost,
    } = request.body as {
      packagingConfigId: string
      saleType: string
      materialCost: number
      packagingCost: number
      processCost: number
      shippingCost: number
      adminFee: number
      vat: number
      totalCost: number
    }

    const config = await prisma.packagingConfig.findUnique({
      where: { id: packagingConfigId },
    })

    if (!config) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_CONFIG', message: '包装配置不存在' },
      })
    }

    // 获取当前版本号
    const lastVersion = await prisma.standardCost.findFirst({
      where: {
        packagingConfigId,
        saleType: saleType as 'domestic' | 'export',
      },
      orderBy: { version: 'desc' },
    })

    // 禁用之前的当前版本
    await prisma.standardCost.updateMany({
      where: {
        packagingConfigId,
        saleType: saleType as 'domestic' | 'export',
        isCurrent: true,
      },
      data: { isCurrent: false },
    })

    const standardCost = await prisma.standardCost.create({
      data: {
        packagingConfigId,
        saleType: saleType as 'domestic' | 'export',
        version: (lastVersion?.version || 0) + 1,
        isCurrent: true,
        materialCost,
        packagingCost,
        processCost,
        shippingCost,
        adminFee,
        vat,
        totalCost,
        setBy: userId,
      },
      include: {
        packagingConfig: {
          include: {
            model: true,
          },
        },
        setByUser: {
          select: { id: true, name: true },
        },
      },
    })

    return { success: true, data: standardCost }
  })

  // PUT /api/v1/standard-costs/:id/set-current
  app.put('/:id/set-current', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['StandardCosts'],
      summary: '设置当前版本',
      description: '将指定标准成本设置为当前版本',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '设置成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: standardCostSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '标准成本不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const userId = getUserId(request)
    const { id } = request.params as { id: string }

    const existing = await prisma.standardCost.findUnique({
      where: { id },
    })

    if (!existing) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '标准成本不存在' },
      })
    }

    // 禁用同类型的其他当前版本
    await prisma.standardCost.updateMany({
      where: {
        packagingConfigId: existing.packagingConfigId,
        saleType: existing.saleType,
        isCurrent: true,
        id: { not: id },
      },
      data: { isCurrent: false },
    })

    const standardCost = await prisma.standardCost.update({
      where: { id },
      data: {
        isCurrent: true,
        setBy: userId,
        setAt: new Date(),
      },
      include: {
        packagingConfig: {
          include: {
            model: true,
          },
        },
        setByUser: {
          select: { id: true, name: true },
        },
      },
    })

    return { success: true, data: standardCost }
  })
}
