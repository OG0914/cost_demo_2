import type { FastifyInstance } from 'fastify'
import { prisma } from '@cost/database'
import { sendError } from '../lib/response-helpers.js'
import {
  modelSchema,
  packagingConfigSchema,
  bomMaterialSchema,
  errorResponseSchema,
  paginatedMetaSchema,
  uuidParamSchema,
} from '../lib/swagger-schemas.js'

const modelQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1, description: '页码' },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: '每页数量' },
    regulationId: { type: 'string', format: 'uuid', description: '法规ID筛选' },
    search: { type: 'string', description: '搜索关键词' },
  },
} as const

const createModelRequestSchema = {
  type: 'object',
  required: ['name', 'regulationId', 'category', 'series'],
  properties: {
    name: { type: 'string', description: '型号名称' },
    regulationId: { type: 'string', format: 'uuid', description: '法规ID' },
    category: { type: 'string', description: '分类' },
    series: { type: 'string', description: '系列' },
    imageUrl: { type: 'string', description: '图片URL' },
  },
} as const

const updateModelRequestSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '型号名称' },
    regulationId: { type: 'string', format: 'uuid', description: '法规ID' },
    category: { type: 'string', description: '分类' },
    series: { type: 'string', description: '系列' },
    imageUrl: { type: 'string', description: '图片URL' },
  },
} as const

export const modelRoutes = async (app: FastifyInstance) => {
  // 提取重复的include配置为常量
  const modelInclude = {
    regulation: true,
  } as const

  const bomInclude = {
    material: true,
  } as const

  // GET /api/v1/models
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Models'],
      summary: '获取型号列表',
      description: '获取所有型号的列表（分页、筛选）',
      security: [{ bearerAuth: [] }],
      querystring: modelQuerySchema,
      response: {
        200: {
          description: '成功获取型号列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: modelSchema,
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
    const { page = '1', pageSize = '20', regulationId = '', search = '' } = request.query as Record<string, string>

    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10)
    const take = parseInt(pageSize, 10)

    const where: {
      regulationId?: string
      OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { category: { contains: string; mode: 'insensitive' } }>
    } = {}

    if (regulationId) where.regulationId = regulationId

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [models, total] = await Promise.all([
      prisma.model.findMany({
        where,
        skip,
        take,
        include: modelInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.model.count({ where }),
    ])

    return {
      success: true,
      data: models,
      meta: {
        page: parseInt(page, 10),
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  })

  // GET /api/v1/models/:id
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Models'],
      summary: '获取型号详情',
      description: '根据 ID 获取型号详细信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取型号详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: modelSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '型号不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const model = await prisma.model.findUnique({
      where: { id },
      include: modelInclude,
    })

    if (!model) return sendError(reply, 404, 'NOT_FOUND', '型号不存在')

    return { success: true, data: model }
  })

  // GET /api/v1/models/:id/packaging-configs
  app.get('/:id/packaging-configs', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Models'],
      summary: '获取型号的包装配置',
      description: '获取指定型号的所有包装配置',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取包装配置列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: packagingConfigSchema,
            },
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '型号不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const model = await prisma.model.findUnique({
      where: { id },
    })

    if (!model) return sendError(reply, 404, 'NOT_FOUND', '型号不存在')

    const configs = await prisma.packagingConfig.findMany({
      where: { modelId: id },
    })

    return { success: true, data: configs }
  })

  // GET /api/v1/models/:id/bom
  app.get('/:id/bom', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Models'],
      summary: '获取型号的 BOM',
      description: '获取指定型号的所有 BOM 物料',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取 BOM 物料列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: bomMaterialSchema,
            },
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '型号不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const model = await prisma.model.findUnique({
      where: { id },
    })

    if (!model) return sendError(reply, 404, 'NOT_FOUND', '型号不存在')

    const bomMaterials = await prisma.bomMaterial.findMany({
      where: { modelId: id },
      include: bomInclude,
      orderBy: { sortOrder: 'asc' },
    })

    return { success: true, data: bomMaterials }
  })

  // POST /api/v1/models
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Models'],
      summary: '创建型号',
      description: '创建新型号',
      security: [{ bearerAuth: [] }],
      body: createModelRequestSchema,
      response: {
        201: {
          description: '型号创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: modelSchema,
          },
        },
        400: {
          description: '验证错误或法规不存在',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { name, regulationId, category, series, imageUrl } = request.body as {
      name: string
      regulationId: string
      category: string
      series: string
      imageUrl?: string
    }

    const regulation = await prisma.regulation.findUnique({
      where: { id: regulationId },
    })

    if (!regulation) return sendError(reply, 400, 'INVALID_REGULATION', '法规不存在')

    const model = await prisma.model.create({
      data: {
        name,
        regulationId,
        category,
        series,
        imageUrl,
      },
    })

    return { success: true, data: model }
  })

  // PUT /api/v1/models/:id
  app.put('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Models'],
      summary: '更新型号',
      description: '更新型号信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: updateModelRequestSchema,
      response: {
        200: {
          description: '型号更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: modelSchema,
          },
        },
        400: {
          description: '验证错误或法规不存在',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '型号不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { name, regulationId, category, series, imageUrl } = request.body as {
      name?: string
      regulationId?: string
      category?: string
      series?: string
      imageUrl?: string
    }

    if (regulationId) {
      const regulation = await prisma.regulation.findUnique({
        where: { id: regulationId },
      })

      if (!regulation) return sendError(reply, 400, 'INVALID_REGULATION', '法规不存在')
    }

    const model = await prisma.model.update({
      where: { id },
      data: {
        name,
        regulationId,
        category,
        series,
        imageUrl,
      },
    })

    return { success: true, data: model }
  })

  // DELETE /api/v1/models/:id
  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Models'],
      summary: '删除型号',
      description: '删除指定型号',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '型号删除成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '型号不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await prisma.model.delete({ where: { id } })

    return { success: true, data: { message: '型号已删除' } }
  })
}
