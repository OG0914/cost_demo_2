import type { FastifyInstance } from 'fastify'
import { prisma } from '@cost/database'
import {
  bomMaterialSchema,
  errorResponseSchema,
  uuidParamSchema,
} from '../lib/swagger-schemas.js'

const bomQuerySchema = {
  type: 'object',
  required: ['modelId'],
  properties: {
    modelId: { type: 'string', format: 'uuid', description: '型号ID' },
  },
} as const

const createBomRequestSchema = {
  type: 'object',
  required: ['modelId', 'materialId', 'quantity'],
  properties: {
    modelId: { type: 'string', format: 'uuid', description: '型号ID' },
    materialId: { type: 'string', format: 'uuid', description: '物料ID' },
    quantity: { type: 'number', minimum: 0, description: '数量' },
    sortOrder: { type: 'integer', description: '排序' },
  },
} as const

const updateBomRequestSchema = {
  type: 'object',
  properties: {
    quantity: { type: 'number', minimum: 0, description: '数量' },
    sortOrder: { type: 'integer', description: '排序' },
  },
} as const

export const bomRoutes = async (app: FastifyInstance) => {
  // GET /api/v1/bom?modelId=:id
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['BOM'],
      summary: '获取 BOM 列表',
      description: '根据型号ID获取 BOM 物料列表',
      security: [{ bearerAuth: [] }],
      querystring: bomQuerySchema,
      response: {
        200: {
          description: '成功获取 BOM 列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: bomMaterialSchema,
            },
          },
        },
        400: {
          description: '缺少参数',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { modelId } = request.query as { modelId?: string }

    if (!modelId) {
      return reply.code(400).send({
        success: false,
        error: { code: 'MISSING_PARAM', message: '缺少modelId参数' },
      })
    }

    const bomMaterials = await prisma.bomMaterial.findMany({
      where: { modelId },
      include: {
        material: true,
        model: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return { success: true, data: bomMaterials }
  })

  // POST /api/v1/bom
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['BOM'],
      summary: '添加 BOM 物料',
      description: '为型号添加 BOM 物料',
      security: [{ bearerAuth: [] }],
      body: createBomRequestSchema,
      response: {
        201: {
          description: 'BOM 物料添加成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: bomMaterialSchema,
          },
        },
        400: {
          description: '验证错误或型号/物料不存在',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { modelId, materialId, quantity, sortOrder } = request.body as {
      modelId: string
      materialId: string
      quantity: number
      sortOrder?: number
    }

    // 验证型号和原材料是否存在
    const [model, material] = await Promise.all([
      prisma.model.findUnique({ where: { id: modelId } }),
      prisma.material.findUnique({ where: { id: materialId } }),
    ])

    if (!model) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_MODEL', message: '型号不存在' },
      })
    }

    if (!material) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_MATERIAL', message: '原材料不存在' },
      })
    }

    // 获取当前最大sortOrder
    const lastItem = await prisma.bomMaterial.findFirst({
      where: { modelId },
      orderBy: { sortOrder: 'desc' },
    })

    const bomMaterial = await prisma.bomMaterial.create({
      data: {
        modelId,
        materialId,
        quantity,
        sortOrder: sortOrder ?? (lastItem ? lastItem.sortOrder + 1 : 1),
      },
      include: {
        material: true,
        model: true,
      },
    })

    return { success: true, data: bomMaterial }
  })

  // PUT /api/v1/bom/:id
  app.put('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['BOM'],
      summary: '更新 BOM 物料',
      description: '更新 BOM 物料信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: updateBomRequestSchema,
      response: {
        200: {
          description: 'BOM 物料更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: bomMaterialSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: 'BOM 物料不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { quantity, sortOrder } = request.body as {
      quantity?: number
      sortOrder?: number
    }

    const bomMaterial = await prisma.bomMaterial.update({
      where: { id },
      data: {
        quantity,
        sortOrder,
      },
      include: {
        material: true,
        model: true,
      },
    })

    return { success: true, data: bomMaterial }
  })

  // DELETE /api/v1/bom/:id
  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['BOM'],
      summary: '删除 BOM 物料',
      description: '删除指定 BOM 物料',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: 'BOM 物料删除成功',
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
          description: 'BOM 物料不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await prisma.bomMaterial.delete({ where: { id } })

    return { success: true, data: { message: 'BOM物料已删除' } }
  })
}
