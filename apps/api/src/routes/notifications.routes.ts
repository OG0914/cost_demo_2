import type { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma, type NotificationStatus } from '@cost/database'
import {
  notificationSchema,
  errorResponseSchema,
  paginatedMetaSchema,
  uuidParamSchema,
  paginationQuerySchema,
} from '../lib/swagger-schemas.js'

const notificationQuerySchema = {
  type: 'object',
  properties: {
    ...paginationQuerySchema.properties,
    status: { type: 'string', enum: ['pending', 'processed'], description: '状态筛选' },
  },
} as const

export const notificationRoutes = async (app: FastifyInstance) => {
  const getUserId = (request: FastifyRequest) => request.user.userId

  // GET /api/v1/notifications
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Notifications'],
      summary: '获取通知列表',
      description: '获取所有通知的列表（分页、筛选）',
      security: [{ bearerAuth: [] }],
      querystring: notificationQuerySchema,
      response: {
        200: {
          description: '成功获取通知列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: notificationSchema,
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
    const { page = '1', pageSize = '20', status = '' } = request.query as Record<string, string>

    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10)
    const take = parseInt(pageSize, 10)

    const where = status ? { status: status as NotificationStatus } : {}

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        include: {
          material: true,
          processor: {
            select: { id: true, name: true },
          },
        },
        orderBy: { triggeredAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ])

    return {
      success: true,
      data: notifications,
      meta: {
        page: parseInt(page, 10),
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  })

  // GET /api/v1/notifications/unread-count
  app.get('/unread-count', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Notifications'],
      summary: '获取未读通知数量',
      description: '获取待处理通知的数量',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: '成功获取未读数量',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                count: { type: 'integer', description: '未读通知数量' },
              },
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
    const count = await prisma.notification.count({
      where: { status: 'pending' as NotificationStatus },
    })

    return { success: true, data: { count } }
  })

  // PUT /api/v1/notifications/:id/process
  app.put('/:id/process', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Notifications'],
      summary: '处理通知',
      description: '将通知标记为已处理',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '通知处理成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: notificationSchema,
          },
        },
        400: {
          description: '通知已处理',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '通知不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const userId = getUserId(request)
    const { id } = request.params as { id: string }

    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '通知不存在' },
      })
    }

    if (notification.status !== 'pending') {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_STATUS', message: '该通知已处理' },
      })
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status: 'processed',
        processedBy: userId,
        processedAt: new Date(),
      },
      include: {
        material: true,
        processor: {
          select: { id: true, name: true },
        },
      },
    })

    return { success: true, data: updated }
  })
}
