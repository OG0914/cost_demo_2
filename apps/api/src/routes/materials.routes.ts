import type { FastifyInstance } from 'fastify'
import { materialController } from '../controllers/material.controller.js'
import {
  materialSchema,
  createMaterialRequestSchema,
  updateMaterialRequestSchema,
  errorResponseSchema,
  paginatedMetaSchema,
  uuidParamSchema,
  paginationQuerySchema,
} from '../lib/swagger-schemas.js'

export const materialRoutes = async (app: FastifyInstance) => {
  // GET /api/v1/materials
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Materials'],
      summary: '获取物料列表',
      description: '获取所有物料的列表（分页）',
      security: [{ bearerAuth: [] }],
      querystring: paginationQuerySchema,
      response: {
        200: {
          description: '成功获取物料列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: materialSchema,
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
  }, materialController.getList)

  // GET /api/v1/materials/:id
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Materials'],
      summary: '获取物料详情',
      description: '根据 ID 获取物料详细信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取物料详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: materialSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '物料不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, materialController.getById)

  // POST /api/v1/materials
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Materials'],
      summary: '创建物料',
      description: '创建新物料',
      security: [{ bearerAuth: [] }],
      body: createMaterialRequestSchema,
      response: {
        201: {
          description: '物料创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: materialSchema,
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
  }, materialController.create)

  // PUT /api/v1/materials/:id
  app.put('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Materials'],
      summary: '更新物料',
      description: '更新物料信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: updateMaterialRequestSchema,
      response: {
        200: {
          description: '物料更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: materialSchema,
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
          description: '物料不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, materialController.update)

  // DELETE /api/v1/materials/:id
  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Materials'],
      summary: '删除物料',
      description: '删除指定物料',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '物料删除成功',
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
          description: '物料不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, materialController.delete)
}
