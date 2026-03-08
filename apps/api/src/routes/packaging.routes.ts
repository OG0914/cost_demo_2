import type { FastifyInstance } from 'fastify'
import { packagingController } from '../controllers/packaging.controller.js'
import {
  packagingConfigSchema,
  errorResponseSchema,
  paginatedMetaSchema,
  uuidParamSchema,
  paginationQuerySchema,
} from '../lib/swagger-schemas.js'

const packagingQuerySchema = {
  type: 'object',
  properties: {
    ...paginationQuerySchema.properties,
    modelId: { type: 'string', format: 'uuid', description: '型号ID筛选' },
  },
} as const

const createPackagingRequestSchema = {
  type: 'object',
  required: ['modelId', 'name', 'packagingType', 'perBox', 'perCarton'],
  properties: {
    modelId: { type: 'string', format: 'uuid', description: '型号ID' },
    name: { type: 'string', description: '配置名称' },
    packagingType: { type: 'string', description: '包装类型' },
    perBox: { type: 'integer', minimum: 1, description: '每箱数量' },
    perCarton: { type: 'integer', minimum: 1, description: '每 carton 数量' },
  },
} as const

const updatePackagingRequestSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '配置名称' },
    packagingType: { type: 'string', description: '包装类型' },
    perBox: { type: 'integer', minimum: 1, description: '每箱数量' },
    perCarton: { type: 'integer', minimum: 1, description: '每 carton 数量' },
  },
} as const

const processSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID' },
    name: { type: 'string', description: '工序名称' },
    price: { type: 'number', minimum: 0, description: '单价' },
    unit: { type: 'string', enum: ['piece', 'dozen'], description: '单位' },
    sortOrder: { type: 'integer', description: '排序' },
  },
} as const

const createProcessRequestSchema = {
  type: 'object',
  required: ['name', 'price', 'unit'],
  properties: {
    name: { type: 'string', description: '工序名称' },
    price: { type: 'number', minimum: 0, description: '单价' },
    unit: { type: 'string', enum: ['piece', 'dozen'], description: '单位' },
    sortOrder: { type: 'integer', description: '排序' },
  },
} as const

const updateProcessRequestSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '工序名称' },
    price: { type: 'number', minimum: 0, description: '单价' },
    unit: { type: 'string', enum: ['piece', 'dozen'], description: '单位' },
    sortOrder: { type: 'integer', description: '排序' },
  },
} as const

const packagingMaterialSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID' },
    name: { type: 'string', description: '包材名称' },
    quantity: { type: 'number', minimum: 0, description: '数量' },
    price: { type: 'number', minimum: 0, description: '单价' },
    boxLength: { type: 'number', nullable: true, description: '箱子长度' },
    boxWidth: { type: 'number', nullable: true, description: '箱子宽度' },
    boxHeight: { type: 'number', nullable: true, description: '箱子高度' },
  },
} as const

const createPackagingMaterialRequestSchema = {
  type: 'object',
  required: ['name', 'quantity', 'price'],
  properties: {
    name: { type: 'string', description: '包材名称' },
    quantity: { type: 'number', minimum: 0, description: '数量' },
    price: { type: 'number', minimum: 0, description: '单价' },
    boxLength: { type: 'number', description: '箱子长度' },
    boxWidth: { type: 'number', description: '箱子宽度' },
    boxHeight: { type: 'number', description: '箱子高度' },
  },
} as const

const updatePackagingMaterialRequestSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '包材名称' },
    quantity: { type: 'number', minimum: 0, description: '数量' },
    price: { type: 'number', minimum: 0, description: '单价' },
    boxLength: { type: 'number', description: '箱子长度' },
    boxWidth: { type: 'number', description: '箱子宽度' },
    boxHeight: { type: 'number', description: '箱子高度' },
  },
} as const

const processIdParamSchema = {
  type: 'object',
  required: ['processId'],
  properties: {
    processId: { type: 'string', format: 'uuid', description: '工序ID' },
  },
} as const

const materialIdParamSchema = {
  type: 'object',
  required: ['materialId'],
  properties: {
    materialId: { type: 'string', format: 'uuid', description: '包材ID' },
  },
} as const

export const packagingRoutes = async (app: FastifyInstance) => {
  // 包装配置 CRUD
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '获取包装配置列表',
      description: '获取所有包装配置的列表（分页、筛选）',
      security: [{ bearerAuth: [] }],
      querystring: packagingQuerySchema,
      response: {
        200: {
          description: '成功获取包装配置列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: packagingConfigSchema,
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
  }, packagingController.getList)

  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '获取包装配置详情',
      description: '根据 ID 获取包装配置详细信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取包装配置详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: packagingConfigSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '包装配置不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.getById)

  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '创建包装配置',
      description: '创建新包装配置',
      security: [{ bearerAuth: [] }],
      body: createPackagingRequestSchema,
      response: {
        201: {
          description: '包装配置创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: packagingConfigSchema,
          },
        },
        400: {
          description: '验证错误或型号不存在',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.create)

  app.put('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '更新包装配置',
      description: '更新包装配置信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: updatePackagingRequestSchema,
      response: {
        200: {
          description: '包装配置更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: packagingConfigSchema,
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
          description: '包装配置不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.update)

  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '删除包装配置',
      description: '删除指定包装配置',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '包装配置删除成功',
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
          description: '包装配置不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.delete)

  // 工序配置
  app.get('/:id/processes', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '获取工序列表',
      description: '获取指定包装配置的工序列表',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取工序列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: processSchema,
            },
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '包装配置不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.getProcesses)

  app.post('/:id/processes', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '添加工序',
      description: '为包装配置添加工序',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: createProcessRequestSchema,
      response: {
        201: {
          description: '工序添加成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: processSchema,
          },
        },
        400: {
          description: '验证错误或包装配置不存在',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.createProcess)

  app.put('/processes/:processId', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '更新工序',
      description: '更新工序信息',
      security: [{ bearerAuth: [] }],
      params: processIdParamSchema,
      body: updateProcessRequestSchema,
      response: {
        200: {
          description: '工序更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: processSchema,
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
          description: '工序不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.updateProcess)

  app.delete('/processes/:processId', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '删除工序',
      description: '删除指定工序',
      security: [{ bearerAuth: [] }],
      params: processIdParamSchema,
      response: {
        200: {
          description: '工序删除成功',
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
          description: '工序不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.deleteProcess)

  // 包材配置
  app.get('/:id/materials', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '获取包材列表',
      description: '获取指定包装配置的包材列表',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取包材列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: packagingMaterialSchema,
            },
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '包装配置不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.getMaterials)

  app.post('/:id/materials', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '添加包材',
      description: '为包装配置添加包材',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: createPackagingMaterialRequestSchema,
      response: {
        201: {
          description: '包材添加成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: packagingMaterialSchema,
          },
        },
        400: {
          description: '验证错误或包装配置不存在',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.createMaterial)

  app.put('/materials/:materialId', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '更新包材',
      description: '更新包材信息',
      security: [{ bearerAuth: [] }],
      params: materialIdParamSchema,
      body: updatePackagingMaterialRequestSchema,
      response: {
        200: {
          description: '包材更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: packagingMaterialSchema,
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
          description: '包材不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.updateMaterial)

  app.delete('/materials/:materialId', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Packaging'],
      summary: '删除包材',
      description: '删除指定包材',
      security: [{ bearerAuth: [] }],
      params: materialIdParamSchema,
      response: {
        200: {
          description: '包材删除成功',
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
          description: '包材不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, packagingController.deleteMaterial)
}
