import type { FastifyInstance } from 'fastify'
import { systemConfigController } from '../controllers/system-config.controller.js'

export const systemConfigRoutes = async (app: FastifyInstance) => {
  app.get('/', { onRequest: [app.authenticate] }, systemConfigController.getList)
  app.get<{ Params: { key: string } }>('/:key', { onRequest: [app.authenticate] }, systemConfigController.getByKey)
  app.put<{ Params: { key: string }; Body: unknown }>('/:key', { onRequest: [app.authenticate] }, systemConfigController.update)
}
