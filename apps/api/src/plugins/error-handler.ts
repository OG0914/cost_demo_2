import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { logError } from './logger.js'

// 错误码定义
export enum ErrorCode {
  // 通用错误 (1xxxx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // 数据库错误 (2xxxx)
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_UNIQUE_VIOLATION = 'DB_UNIQUE_VIOLATION',
  DB_FOREIGN_KEY_VIOLATION = 'DB_FOREIGN_KEY_VIOLATION',
  DB_RECORD_NOT_FOUND = 'DB_RECORD_NOT_FOUND',

  // 业务错误 (3xxxx)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // 外部服务错误 (4xxxx)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

// HTTP 状态码映射
const errorCodeToStatusMap: Record<ErrorCode, number> = {
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.DB_CONNECTION_ERROR]: 503,
  [ErrorCode.DB_QUERY_ERROR]: 500,
  [ErrorCode.DB_UNIQUE_VIOLATION]: 409,
  [ErrorCode.DB_FOREIGN_KEY_VIOLATION]: 400,
  [ErrorCode.DB_RECORD_NOT_FOUND]: 404,
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 422,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 405,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.TIMEOUT_ERROR]: 504,
}

// Prisma 错误码映射
const prismaErrorMap: Record<string, { code: ErrorCode; message: string }> = {
  P2000: { code: ErrorCode.VALIDATION_ERROR, message: '输入数据超出字段长度限制' },
  P2001: { code: ErrorCode.DB_RECORD_NOT_FOUND, message: '查询的记录不存在' },
  P2002: { code: ErrorCode.DB_UNIQUE_VIOLATION, message: '记录已存在（唯一约束冲突）' },
  P2003: { code: ErrorCode.DB_FOREIGN_KEY_VIOLATION, message: '外键约束失败' },
  P2004: { code: ErrorCode.DB_QUERY_ERROR, message: '数据库约束失败' },
  P2005: { code: ErrorCode.VALIDATION_ERROR, message: '字段值无效' },
  P2006: { code: ErrorCode.VALIDATION_ERROR, message: '提供的字段值无效' },
  P2007: { code: ErrorCode.VALIDATION_ERROR, message: '数据验证错误' },
  P2008: { code: ErrorCode.DB_QUERY_ERROR, message: '查询解析失败' },
  P2009: { code: ErrorCode.DB_QUERY_ERROR, message: '查询验证失败' },
  P2010: { code: ErrorCode.DB_QUERY_ERROR, message: '原始查询失败' },
  P2011: { code: ErrorCode.VALIDATION_ERROR, message: '违反非空约束' },
  P2012: { code: ErrorCode.VALIDATION_ERROR, message: '缺少必填字段' },
  P2013: { code: ErrorCode.VALIDATION_ERROR, message: '缺少必要参数' },
  P2014: { code: ErrorCode.DB_FOREIGN_KEY_VIOLATION, message: '违反外键约束关系' },
  P2015: { code: ErrorCode.DB_RECORD_NOT_FOUND, message: '关联记录未找到' },
  P2016: { code: ErrorCode.DB_QUERY_ERROR, message: '查询解释错误' },
  P2017: { code: ErrorCode.DB_RECORD_NOT_FOUND, message: '记录之间的关系未找到' },
  P2018: { code: ErrorCode.DB_RECORD_NOT_FOUND, message: '必需的连接记录未找到' },
  P2019: { code: ErrorCode.VALIDATION_ERROR, message: '输入数据验证失败' },
  P2020: { code: ErrorCode.VALIDATION_ERROR, message: '数值超出范围' },
  P2021: { code: ErrorCode.DB_QUERY_ERROR, message: '表不存在' },
  P2022: { code: ErrorCode.DB_QUERY_ERROR, message: '列不存在' },
  P2023: { code: ErrorCode.DB_QUERY_ERROR, message: '列数据不一致' },
  P2024: { code: ErrorCode.DB_CONNECTION_ERROR, message: '数据库连接超时' },
  P2025: { code: ErrorCode.DB_RECORD_NOT_FOUND, message: '记录不存在' },
  P2026: { code: ErrorCode.DB_QUERY_ERROR, message: '数据库不支持该查询' },
  P2027: { code: ErrorCode.DB_QUERY_ERROR, message: '多个数据库错误' },
  P2028: { code: ErrorCode.DB_CONNECTION_ERROR, message: '事务 API 错误' },
  P2029: { code: ErrorCode.VALIDATION_ERROR, message: '查询参数数量超出限制' },
  P2030: { code: ErrorCode.DB_QUERY_ERROR, message: '无法找到全文索引' },
  P2031: { code: ErrorCode.DB_CONNECTION_ERROR, message: 'MongoDB 需要副本集' },
  P2033: { code: ErrorCode.VALIDATION_ERROR, message: '数字超出 64 位整数范围' },
  P2034: { code: ErrorCode.RESOURCE_CONFLICT, message: '事务冲突，请重试' },
}

// 统一错误响应格式
export interface ErrorResponse {
  success: false
  error: {
    code: ErrorCode | string
    message: string
    details?: unknown
    // 开发环境额外信息
    stack?: string
    originalError?: unknown
  }
  timestamp: string
  requestId?: string
  path?: string
}

// 自定义应用错误类
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = errorCodeToStatusMap[code] || 500
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

// 错误处理器
export const errorHandler = fp(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((
    error: FastifyError | AppError | Error,
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const isDev = process.env.NODE_ENV === 'development'
    const reqId = request.id as string
    const path = request.url

    // 默认错误响应
    let errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: '服务器内部错误',
      },
      timestamp: new Date().toISOString(),
      requestId: reqId,
      path,
    }

    // 处理 Prisma 错误
    if ('code' in error && typeof error.code === 'string' && error.code.startsWith('P')) {
      const prismaError = prismaErrorMap[error.code]
      if (prismaError) {
        errorResponse.error.code = prismaError.code
        errorResponse.error.message = prismaError.message
      } else {
        errorResponse.error.code = ErrorCode.DB_QUERY_ERROR
        errorResponse.error.message = '数据库操作失败'
      }

      // 记录数据库错误
      logError(fastify.log, error, {
        reqId,
        method: request.method,
        url: path,
        userId: (request as FastifyRequest & { user?: { userId: string } }).user?.userId,
        prismaCode: error.code,
      })
    }
    // 处理 Fastify 验证错误
    else if ('validation' in error && error.validation) {
      errorResponse.error.code = ErrorCode.VALIDATION_ERROR
      errorResponse.error.message = '请求参数验证失败'
      errorResponse.error.details = error.validation

      logError(fastify.log, error, {
        reqId,
        method: request.method,
        url: path,
        validation: error.validation,
      })
    }
    // 处理自定义 AppError
    else if (error instanceof AppError) {
      errorResponse.error.code = error.code
      errorResponse.error.message = error.message
      errorResponse.error.details = error.details

      logError(fastify.log, error, {
        reqId,
        method: request.method,
        url: path,
        code: error.code,
      })
    }
    // 处理 JWT 错误
    else if (error.name === 'JsonWebTokenError') {
      errorResponse.error.code = ErrorCode.UNAUTHORIZED
      errorResponse.error.message = '无效的认证令牌'

      logError(fastify.log, error, {
        reqId,
        method: request.method,
        url: path,
      })
    }
    else if (error.name === 'TokenExpiredError') {
      errorResponse.error.code = ErrorCode.UNAUTHORIZED
      errorResponse.error.message = '认证令牌已过期'

      logError(fastify.log, error, {
        reqId,
        method: request.method,
        url: path,
      })
    }
    // 处理超时错误
    else if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      errorResponse.error.code = ErrorCode.TIMEOUT_ERROR
      errorResponse.error.message = '请求处理超时，请稍后重试'

      logError(fastify.log, error, {
        reqId,
        method: request.method,
        url: path,
      })
    }
    // 处理其他错误
    else {
      const statusCode = (error as FastifyError).statusCode || 500
      errorResponse.error.code = (error as FastifyError).code || ErrorCode.INTERNAL_ERROR
      errorResponse.error.message = statusCode >= 500 && !isDev
        ? '服务器内部错误'
        : error.message || 'Unknown error'

      // 开发环境添加详细信息
      if (isDev) {
        errorResponse.error.stack = error.stack
        errorResponse.error.originalError = error
      }

      // 记录服务器错误
      if (statusCode >= 500) {
        logError(fastify.log, error, {
          reqId,
          method: request.method,
          url: path,
          statusCode,
        })
      }
    }

    // 获取状态码
    const statusCode = error instanceof AppError
      ? error.statusCode
      : (error as FastifyError).statusCode
        || errorCodeToStatusMap[errorResponse.error.code as ErrorCode]
        || 500

    reply.code(statusCode).send(errorResponse)
  })

  // 处理 404 路由未找到
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const reqId = request.id as string

    fastify.log.warn({
      reqId,
      method: request.method,
      url: request.url,
    }, 'Route not found')

    reply.code(404).send({
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: `路由 ${request.method} ${request.url} 不存在`,
      },
      timestamp: new Date().toISOString(),
      requestId: reqId,
      path: request.url,
    })
  })
})

// 便捷的错误创建函数
export const createError = {
  badRequest: (message: string, details?: unknown) =>
    new AppError(ErrorCode.BAD_REQUEST, message, details),

  unauthorized: (message: string = '未授权访问') =>
    new AppError(ErrorCode.UNAUTHORIZED, message),

  forbidden: (message: string = '禁止访问') =>
    new AppError(ErrorCode.FORBIDDEN, message),

  notFound: (resource: string, id?: string) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource}${id ? ` (ID: ${id})` : ''} 不存在`),

  validation: (message: string, details?: unknown) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, details),

  conflict: (message: string) =>
    new AppError(ErrorCode.RESOURCE_CONFLICT, message),

  business: (message: string, details?: unknown) =>
    new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, message, details),

  internal: (message: string = '服务器内部错误') =>
    new AppError(ErrorCode.INTERNAL_ERROR, message),
}

export default errorHandler
