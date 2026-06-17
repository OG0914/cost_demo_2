import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Prisma } from '@cost/database'
import { systemConfigService } from '../services/system-config.service.js'
import { sendSuccess, sendError, sendNotFound } from '../lib/response-helpers.js'
import { updateSystemConfigSchema } from '../lib/schemas.js'

export const systemConfigController = {
  async getList(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const configs = await systemConfigService.getList()
      sendSuccess(reply, configs)
    } catch (error) {
      sendError(reply, 500, 'INTERNAL_ERROR', (error as Error).message)
    }
  },

  async getByKey(request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) {
    try {
      const config = await systemConfigService.getByKey(request.params.key)
      if (!config) return sendNotFound(reply, 'SystemConfig')
      sendSuccess(reply, config)
    } catch (error) {
      sendError(reply, 500, 'INTERNAL_ERROR', (error as Error).message)
    }
  },

  async update(request: FastifyRequest<{ Params: { key: string }; Body: unknown }>, reply: FastifyReply) {
    try {
      const validation = updateSystemConfigSchema.safeParse(request.body)
      if (!validation.success) {
        return sendError(reply, 400, 'VALIDATION_ERROR', validation.error.errors[0].message)
      }

      const updated = await systemConfigService.update(request.params.key, validation.data.value as Prisma.InputJsonValue)
      sendSuccess(reply, updated)
    } catch (error) {
      sendError(reply, 500, 'INTERNAL_ERROR', (error as Error).message)
    }
  },
}
