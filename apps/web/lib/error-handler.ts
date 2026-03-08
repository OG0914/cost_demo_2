import { AxiosError } from 'axios'
import type { ApiResponse } from '@cost/shared-types'

// 错误类型定义
export type ErrorType =
  | 'network'
  | 'timeout'
  | 'server'
  | 'validation'
  | 'auth'
  | 'forbidden'
  | 'not_found'
  | 'business'
  | 'unknown'

// 错误码定义（与后端保持一致）
export enum ErrorCode {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_UNIQUE_VIOLATION = 'DB_UNIQUE_VIOLATION',
  DB_FOREIGN_KEY_VIOLATION = 'DB_FOREIGN_KEY_VIOLATION',
  DB_RECORD_NOT_FOUND = 'DB_RECORD_NOT_FOUND',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

// 应用错误类
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly code: string
  public readonly statusCode?: number
  public readonly details?: unknown
  public readonly originalError?: Error

  constructor(
    type: ErrorType,
    message: string,
    code: string = 'UNKNOWN',
    statusCode?: number,
    details?: unknown,
    originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.originalError = originalError
  }
}

// 错误消息本地化映射
const errorMessages: Record<ErrorCode | string, string> = {
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误，请稍后重试',
  [ErrorCode.VALIDATION_ERROR]: '输入数据验证失败，请检查您的输入',
  [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.FORBIDDEN]: '您没有权限执行此操作',
  [ErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.TOO_MANY_REQUESTS]: '请求过于频繁，请稍后再试',
  [ErrorCode.DB_CONNECTION_ERROR]: '数据库连接失败，请稍后重试',
  [ErrorCode.DB_QUERY_ERROR]: '数据查询失败',
  [ErrorCode.DB_UNIQUE_VIOLATION]: '数据已存在，请勿重复添加',
  [ErrorCode.DB_FOREIGN_KEY_VIOLATION]: '数据关联错误，请先删除关联数据',
  [ErrorCode.DB_RECORD_NOT_FOUND]: '记录不存在或已被删除',
  [ErrorCode.BUSINESS_RULE_VIOLATION]: '业务规则校验失败',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: '权限不足',
  [ErrorCode.RESOURCE_CONFLICT]: '资源冲突，请刷新后重试',
  [ErrorCode.OPERATION_NOT_ALLOWED]: '当前操作不被允许',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服务调用失败',
  [ErrorCode.TIMEOUT_ERROR]: '请求超时，请稍后重试',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  UNKNOWN_ERROR: '发生未知错误，请稍后重试',
}

// HTTP 状态码映射到错误类型
const statusCodeToErrorType: Record<number, ErrorType> = {
  400: 'validation',
  401: 'auth',
  403: 'forbidden',
  404: 'not_found',
  409: 'business',
  422: 'validation',
  429: 'business',
  500: 'server',
  502: 'server',
  503: 'server',
  504: 'timeout',
}

/**
 * 解析 API 错误
 */
export function parseApiError(error: unknown): AppError {
  // 已经是 AppError，直接返回
  if (error instanceof AppError) {
    return error
  }

  // Axios 错误
  if (error instanceof AxiosError) {
    return parseAxiosError(error)
  }

  // 标准 Error
  if (error instanceof Error) {
    // 网络错误
    if (error.message === 'Network Error') {
      return new AppError(
        'network',
        errorMessages.NETWORK_ERROR,
        'NETWORK_ERROR',
        undefined,
        undefined,
        error
      )
    }

    // 超时错误
    if (error.message.includes('timeout')) {
      return new AppError(
        'timeout',
        errorMessages.TIMEOUT_ERROR,
        'TIMEOUT_ERROR',
        undefined,
        undefined,
        error
      )
    }

    return new AppError(
      'unknown',
      error.message || errorMessages.UNKNOWN_ERROR,
      'UNKNOWN',
      undefined,
      undefined,
      error
    )
  }

  // 其他类型
  return new AppError(
    'unknown',
    errorMessages.UNKNOWN_ERROR,
    'UNKNOWN'
  )
}

/**
 * 解析 Axios 错误
 */
function parseAxiosError(error: AxiosError<ApiResponse<unknown>>): AppError {
  const response = error.response
  const statusCode = response?.status

  // 无响应（网络错误）
  if (!response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new AppError(
        'timeout',
        errorMessages.TIMEOUT_ERROR,
        'TIMEOUT_ERROR',
        undefined,
        undefined,
        error
      )
    }

    return new AppError(
      'network',
      errorMessages.NETWORK_ERROR,
      'NETWORK_ERROR',
      undefined,
      undefined,
      error
    )
  }

  // 获取后端返回的错误信息
  const apiError = response.data?.error
  const errorCode = apiError?.code || 'UNKNOWN'
  const errorMessage = apiError?.message || errorMessages[errorCode] || '请求失败'
  const errorDetails = apiError?.details

  // 根据状态码确定错误类型
  const errorType = statusCode ? statusCodeToErrorType[statusCode] || 'unknown' : 'unknown'

  return new AppError(
    errorType,
    errorMessage,
    errorCode,
    statusCode,
    errorDetails,
    error
  )
}

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(error: unknown): string {
  const appError = parseApiError(error)
  return appError.message
}

/**
 * 获取错误类型
 */
export function getErrorType(error: unknown): ErrorType {
  const appError = parseApiError(error)
  return appError.type
}

/**
 * 检查是否为特定错误类型
 */
export function isErrorType(error: unknown, type: ErrorType): boolean {
  return getErrorType(error) === type
}

/**
 * 检查是否为认证错误
 */
export function isAuthError(error: unknown): boolean {
  const appError = parseApiError(error)
  return appError.type === 'auth' || appError.code === ErrorCode.UNAUTHORIZED
}

/**
 * 检查是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  const appError = parseApiError(error)
  return appError.type === 'network' || appError.type === 'timeout'
}

/**
 * 检查是否为可重试错误
 */
export function isRetryableError(error: unknown): boolean {
  const appError = parseApiError(error)
  return ['network', 'timeout', 'server'].includes(appError.type)
}

/**
 * 全局错误处理器
 */
export function handleGlobalError(
  error: unknown,
  options: {
    showToast?: (message: string) => void
    onAuthError?: () => void
    onError?: (error: AppError) => void
    logError?: boolean
  } = {}
): AppError {
  const appError = parseApiError(error)

  // 记录错误
  if (options.logError !== false) {
    console.error('[Global Error]', appError)
  }

  // 认证错误处理
  if (appError.type === 'auth' && options.onAuthError) {
    options.onAuthError()
    return appError
  }

  // 显示错误提示
  if (options.showToast) {
    options.showToast(appError.message)
  }

  // 自定义错误处理
  if (options.onError) {
    options.onError(appError)
  }

  return appError
}

/**
 * 创建错误处理器（用于 React Query 等）
 */
export function createErrorHandler(
  options: {
    showToast?: (message: string) => void
    onAuthError?: () => void
    onError?: (error: AppError) => void
  } = {}
) {
  return (error: unknown) => {
    return handleGlobalError(error, options)
  }
}

/**
 * 安全执行函数 - 包装可能抛出错误的操作
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  options: {
    fallbackValue?: T
    onError?: (error: AppError) => void
    showToast?: (message: string) => void
  } = {}
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    const appError = handleGlobalError(error, {
      showToast: options.showToast,
      onError: options.onError,
    })

    if (options.fallbackValue !== undefined) {
      return options.fallbackValue
    }

    throw appError
  }
}

/**
 * 错误上报函数
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {}
): void {
  const appError = parseApiError(error)

  const reportData = {
    error: {
      name: appError.name,
      message: appError.message,
      code: appError.code,
      type: appError.type,
      stack: appError.originalError?.stack,
    },
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
  }

  // 发送到错误收集服务
  if (typeof window !== 'undefined') {
    // 使用 Beacon API 确保错误能被发送
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(reportData)], {
        type: 'application/json',
      })
      navigator.sendBeacon('/api/v1/errors/client', blob)
    } else {
      // 降级使用 fetch
      fetch('/api/v1/errors/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
        keepalive: true,
      }).catch(() => {
        // 忽略上报失败
      })
    }
  }

  // 开发环境输出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Report]', reportData)
  }
}

/**
 * 初始化全局错误监听
 */
export function initGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return

  // 监听未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { type: 'unhandledrejection' })
  })

  // 监听全局错误
  window.addEventListener('error', (event) => {
    reportError(event.error, {
      type: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })
}

export default {
  parseApiError,
  getErrorMessage,
  getErrorType,
  isErrorType,
  isAuthError,
  isNetworkError,
  isRetryableError,
  handleGlobalError,
  createErrorHandler,
  safeExecute,
  reportError,
  initGlobalErrorHandlers,
}
