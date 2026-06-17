import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UserPayload } from '../types/fastify.js'

function isUserPayload(user: unknown): user is UserPayload {
  return (
    typeof user === 'object' &&
    user !== null &&
    'userId' in user &&
    typeof (user as UserPayload).userId === 'string' &&
    'username' in user &&
    typeof (user as UserPayload).username === 'string' &&
    'role' in user &&
    typeof (user as UserPayload).role === 'string'
  )
}

export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user

    if (!isUserPayload(user)) {
      return reply.status(401).send({
        success: false,
        message: '未登录',
        code: 'UNAUTHORIZED',
      })
    }

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        message: '无权限执行此操作',
        code: 'FORBIDDEN',
      })
    }
  }
}
