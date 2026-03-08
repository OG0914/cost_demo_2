import type { FastifyInstance } from 'fastify'
import { quotationController } from '../controllers/quotation.controller.js'
import {
  quotationSchema,
  createQuotationRequestSchema,
  calculateQuotationRequestSchema,
  errorResponseSchema,
  paginatedMetaSchema,
  uuidParamSchema,
  paginationQuerySchema,
} from '../lib/swagger-schemas.js'

const submitQuotationResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', example: 'submitted' },
        submittedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
} as const

const approveQuotationResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', example: 'approved' },
        approvedAt: { type: 'string', format: 'date-time' },
        approvedBy: { type: 'string', format: 'uuid' },
      },
    },
  },
} as const

const rejectQuotationResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', example: 'rejected' },
        rejectedAt: { type: 'string', format: 'date-time' },
        rejectedBy: { type: 'string', format: 'uuid' },
      },
    },
  },
} as const

const calculateQuotationResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        materialCost: { type: 'number', description: '物料成本' },
        packagingCost: { type: 'number', description: '包装成本' },
        processCost: { type: 'number', description: '工序成本' },
        shippingCost: { type: 'number', description: '运输成本' },
        adminFee: { type: 'number', description: '管理费' },
        vat: { type: 'number', description: '增值税' },
        totalCost: { type: 'number', description: '总成本' },
      },
    },
  },
} as const

export const quotationRoutes = async (app: FastifyInstance) => {
  // GET /api/v1/quotations
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Quotations'],
      summary: '获取报价单列表',
      description: '获取所有报价单的列表（分页）',
      security: [{ bearerAuth: [] }],
      querystring: paginationQuerySchema,
      response: {
        200: {
          description: '成功获取报价单列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: quotationSchema,
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
  }, quotationController.getList)

  // GET /api/v1/quotations/:id
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Quotations'],
      summary: '获取报价单详情',
      description: '根据 ID 获取报价单详细信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '成功获取报价单详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: quotationSchema,
          },
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '报价单不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, quotationController.getById)

  // POST /api/v1/quotations
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Quotations'],
      summary: '创建报价单',
      description: '创建新报价单',
      security: [{ bearerAuth: [] }],
      body: createQuotationRequestSchema,
      response: {
        201: {
          description: '报价单创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: quotationSchema,
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
  }, quotationController.create)

  // PUT /api/v1/quotations/:id
  app.put('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Quotations'],
      summary: '更新报价单',
      description: '更新报价单信息',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      body: {
        type: 'object',
        properties: {
          customerId: { type: 'string', format: 'uuid', description: '客户ID' },
          regulationId: { type: 'string', format: 'uuid', description: '法规ID' },
          modelId: { type: 'string', format: 'uuid', description: '型号ID' },
          packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID' },
          saleType: { type: 'string', enum: ['domestic', 'export'], description: '销售类型' },
          shippingType: { type: 'string', enum: ['fcl20', 'fcl40', 'lcl'], description: '运输方式' },
          quantity: { type: 'integer', minimum: 1, description: '数量' },
          materialCost: { type: 'number', minimum: 0, description: '物料成本' },
          packagingCost: { type: 'number', minimum: 0, description: '包装成本' },
          processCost: { type: 'number', minimum: 0, description: '工序成本' },
          shippingCost: { type: 'number', minimum: 0, description: '运输成本' },
          adminFee: { type: 'number', minimum: 0, description: '管理费' },
          vat: { type: 'number', minimum: 0, description: '增值税' },
          totalCost: { type: 'number', minimum: 0, description: '总成本' },
        },
      },
      response: {
        200: {
          description: '报价单更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: quotationSchema,
          },
        },
        400: {
          description: '验证错误或状态不允许修改',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '报价单不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, quotationController.update)

  // DELETE /api/v1/quotations/:id
  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Quotations'],
      summary: '删除报价单',
      description: '删除指定报价单',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '报价单删除成功',
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
          description: '报价单不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, quotationController.delete)

  // POST /api/v1/quotations/:id/submit
  app.post('/:id/submit', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Quotations'],
      summary: '提交报价单',
      description: '提交报价单进行审核',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '报价单提交成功',
          ...submitQuotationResponseSchema,
        },
        400: {
          description: '状态不允许提交',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '报价单不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, quotationController.submit)

  // POST /api/v1/quotations/:id/approve
  app.post('/:id/approve', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Quotations'],
      summary: '审批通过报价单',
      description: '审批通过指定报价单',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '报价单审批通过',
          ...approveQuotationResponseSchema,
        },
        400: {
          description: '状态不允许审批',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '报价单不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, quotationController.approve)

  // POST /api/v1/quotations/:id/reject
  app.post('/:id/reject', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Quotations'],
      summary: '驳回报价单',
      description: '驳回指定报价单',
      security: [{ bearerAuth: [] }],
      params: uuidParamSchema,
      response: {
        200: {
          description: '报价单已驳回',
          ...rejectQuotationResponseSchema,
        },
        400: {
          description: '状态不允许驳回',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
        404: {
          description: '报价单不存在',
          ...errorResponseSchema,
        },
      },
    },
  }, quotationController.reject)

  // POST /api/v1/quotations/calculate
  app.post('/calculate', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Quotations'],
      summary: '计算报价',
      description: '根据型号、包装配置等参数计算报价',
      security: [{ bearerAuth: [] }],
      body: calculateQuotationRequestSchema,
      response: {
        200: {
          description: '报价计算成功',
          ...calculateQuotationResponseSchema,
        },
        400: {
          description: '验证错误或参数无效',
          ...errorResponseSchema,
        },
        401: {
          description: '未授权',
          ...errorResponseSchema,
        },
      },
    },
  }, quotationController.calculate)
}
