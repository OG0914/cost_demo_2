import type { FastifyInstance } from 'fastify'
import { systemConfigController } from '../controllers/system-config.controller.js'

export const systemConfigRoutes = async (app: FastifyInstance) => {
  app.get('/', systemConfigController.getList)
  app.get('/:key', systemConfigController.getByKey)
  app.put('/:key', systemConfigController.update)
}
