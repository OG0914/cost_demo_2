import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '@cost/database'
import { loginSchema } from '../lib/schemas.js'
import { loginRequestSchema, loginResponseSchema, errorResponseSchema, userSchema } from '../lib/swagger-schemas.js'

export const authRoutes = async (app: FastifyInstance) => {
  // POST /api/v1/auth/login
  app.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: '用户登录',
      description: '使用用户名和密码登录，返回 JWT token',
      body: loginRequestSchema,
      response: {
        200: {
          description: '登录成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: loginResponseSchema,
          },
        },
        400: {
          description: '验证错误',
          ...errorResponseSchema,
        },
        401: {
          description: '认证失败',
          ...errorResponseSchema,
        },
      },
    },
  }, async (request, reply) => {
    const validation = loginSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message },
      })
    }
    const { username, password } = validation.data

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || user.status !== 'active') {
      return reply.code(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' },
      })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return reply.code(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' },
      })
    }

    const token = await reply.jwtSign({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    }
  })

  // GET /api/v1/auth/me
  app.get('/me', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Auth'],
      summary: '获取当前用户信息',
      description: '获取当前登录用户的详细信息',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: '成功获取用户信息',
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
      },
    },
  }, async (request) => {
    const userId = request.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return { success: true, data: user }
  })

  // POST /api/v1/auth/logout
  app.post('/logout', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Auth'],
      summary: '用户登出',
      description: '用户登出（客户端需清除 token）',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: '登出成功',
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
      },
    },
  }, async () => {
    return { success: true, data: { message: 'Logged out successfully' } }
  })
}
