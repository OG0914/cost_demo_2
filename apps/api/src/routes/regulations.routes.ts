import type { FastifyInstance } from 'fastify'
import { prisma, type RegulationStatus } from '@cost/database'
import { createRegulationSchema, updateRegulationSchema, formatZodError } from '../lib/schemas.js'
import { sendError } from '../lib/response-helpers.js'
import {
  regulationSchema,
  createRegulationRequestSchema,
  updateRegulationRequestSchema,
  errorResponseSchema,
  uuidParamSchema,
} from '../lib/swagger-schemas.js'

export const regulationRoutes = async (app: FastifyInstance) => {
  // GET /api/v1/regulations
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Regulations'],
      summary: '获取法规列表',
      description: '获取所有法规的列表',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: '成功获取法规列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: regulationSchema,
            },
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, async () => {
    const regulations = await prisma.regulation.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: regulations }
  })

  // GET /api/v1/regulations/:id
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Regulations'],
      summary: '获取法规详情',
      description: '根据 ID 获取法规详细信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取法规详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: regulationSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '法规不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const regulation = await prisma.regulation.findUnique({
      where: { id },
    })

    if (!regulation) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '法规不存在' },
      })
    }

    return { success: true, data: regulation }
  })

  // POST /api/v1/regulations
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Regulations'],
      summary: '创建法规',
      description: '创建新法规',
      security: [{ bearerAuth: [] }],
      body: createRegulationRequestSchema,
      response: {
        201: {
          description: '法规创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: regulationSchema,
          },
        },
        400: {
          description: '验证错误',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const validation = createRegulationSchema.safeParse(request.body)
    if (!validation.success) return sendError(reply, 400, 'VALIDATION_ERROR', formatZodError(validation.error))
    const { code, name, description, status } = validation.data

    const regulation = await prisma.regulation.create({
      data: {
        code,
        name,
        description,
        status: (status || 'active') as RegulationStatus,
      },
    })

    return { success: true, data: regulation }
  })

  // PUT /api/v1/regulations/:id
  app.put('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Regulations'],
      summary: '更新法规',
      description: '更新法规信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: updateRegulationRequestSchema,
      response: {
        200: {
          description: '法规更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: regulationSchema,
          },
        },
        400: {
          description: '验证错误',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '法规不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const validation = updateRegulationSchema.safeParse(request.body)
    if (!validation.success) return sendError(reply, 400, 'VALIDATION_ERROR', formatZodError(validation.error))
    const { code, name, description, status } = validation.data

    const regulation = await prisma.regulation.update({
      where: { id },
      data: {
        code,
        name,
        description,
        status: status as RegulationStatus | undefined,
      },
    })

    return { success: true, data: regulation }
  })

  // DELETE /api/v1/regulations/:id
  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Regulations'],
      summary: '删除法规',
      description: '删除指定法规',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '法规删除成功',
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
          description: '法规不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await prisma.regulation.delete({ where: { id } })

    return { success: true, data: { message: '法规已删除' } }
  })
}
