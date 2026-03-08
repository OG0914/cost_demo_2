import type { FastifyInstance } from 'fastify'
import { customerController } from '../controllers/customer.controller.js'
import {
  customerSchema,
  createCustomerRequestSchema,
  updateCustomerRequestSchema,
  errorResponseSchema,
  paginatedMetaSchema,
  uuidParamSchema,
  paginationQuerySchema,
} from '../lib/swagger-schemas.js'

export const customerRoutes = async (app: FastifyInstance): Promise<void> => {
  // GET /api/v1/customers
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Customers'],
      summary: '获取客户列表',
      description: '获取所有客户的列表（分页）',
      security: [{ bearerAuth: [] }],
      querystring: paginationQuerySchema,
      response: {
        200: {
          description: '成功获取客户列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: customerSchema,
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
  }, customerController.getList.bind(customerController))

  // GET /api/v1/customers/:id
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Customers'],
      summary: '获取客户详情',
      description: '根据 ID 获取客户详细信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取客户详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: customerSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '客户不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, customerController.getById.bind(customerController))

  // POST /api/v1/customers
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Customers'],
      summary: '创建客户',
      description: '创建新客户',
      security: [{ bearerAuth: [] }],
      body: createCustomerRequestSchema,
      response: {
        201: {
          description: '客户创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: customerSchema,
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
  }, customerController.create.bind(customerController))

  // PUT /api/v1/customers/:id
  app.put('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Customers'],
      summary: '更新客户',
      description: '更新客户信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: updateCustomerRequestSchema,
      response: {
        200: {
          description: '客户更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: customerSchema,
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
          description: '客户不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, customerController.update.bind(customerController))

  // DELETE /api/v1/customers/:id
  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Customers'],
      summary: '删除客户',
      description: '删除指定客户',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '客户删除成功',
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
          description: '客户不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, customerController.delete.bind(customerController))
}
