import type { FastifyInstance } from 'fastify'
import { userController } from '../controllers/user.controller.js'
import {
  userSchema,
  errorResponseSchema,
  paginatedMetaSchema,
  uuidParamSchema,
  paginationQuerySchema,
} from '../lib/swagger-schemas.js'

const createUserRequestSchema = {
  type: 'object',
  required: ['username', 'password', 'name', 'email', 'role'],
  properties: {
    username: { type: 'string', minLength: 1, maxLength: 50, description: '用户名' },
    password: { type: 'string', minLength: 6, maxLength: 100, description: '密码' },
    name: { type: 'string', minLength: 1, maxLength: 50, description: '姓名' },
    email: { type: 'string', format: 'email', description: '邮箱' },
    role: { type: 'string', enum: ['admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly'], description: '角色' },
    status: { type: 'string', enum: ['active', 'inactive'], description: '状态' },
  },
} as const

const updateUserRequestSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 50, description: '姓名' },
    email: { type: 'string', format: 'email', description: '邮箱' },
    role: { type: 'string', enum: ['admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly'], description: '角色' },
    status: { type: 'string', enum: ['active', 'inactive'], description: '状态' },
  },
} as const

export const userRoutes = async (app: FastifyInstance): Promise<void> => {
  // GET /api/v1/users
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Users'],
      summary: '获取用户列表',
      description: '获取所有用户的列表（分页）',
      security: [{ bearerAuth: [] }],
      querystring: paginationQuerySchema,
      response: {
        200: {
          description: '成功获取用户列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: userSchema,
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
  }, userController.getList.bind(userController))

  // GET /api/v1/users/:id
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Users'],
      summary: '获取用户详情',
      description: '根据 ID 获取用户详细信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取用户详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: userSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '用户不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, userController.getById.bind(userController))

  // POST /api/v1/users
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Users'],
      summary: '创建用户',
      description: '创建新用户',
      security: [{ bearerAuth: [] }],
      body: createUserRequestSchema,
      response: {
        201: {
          description: '用户创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: userSchema,
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
  }, userController.create.bind(userController))

  // PUT /api/v1/users/:id
  app.put('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Users'],
      summary: '更新用户',
      description: '更新用户信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: updateUserRequestSchema,
      response: {
        200: {
          description: '用户更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: userSchema,
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
          description: '用户不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, userController.update.bind(userController))

  // DELETE /api/v1/users/:id
  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Users'],
      summary: '删除用户',
      description: '删除指定用户',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '用户删除成功',
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
          description: '用户不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, userController.delete.bind(userController))
}
